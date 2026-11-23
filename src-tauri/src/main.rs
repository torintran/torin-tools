#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod version;

use regex::{Captures, Regex};
use reqwest::{
    header::{ACCEPT, CONTENT_TYPE, RETRY_AFTER},
    redirect::Policy,
    Client,
};
use serde::Serialize;
use serde_json::Value;
use std::{io::Write, sync::{Mutex, OnceLock}, time::Duration};
use tauri::{ipc::{InvokeBody, Request}, AppHandle, State};
use tauri_plugin_dialog::DialogExt;
use tokio_util::sync::CancellationToken;

const ORIGIN: &str = "https://api.postman.com";
const MAX_RESPONSE: usize = 16 * 1024 * 1024;
const MAX_ZIP: usize = 65 * 1024 * 1024;
const UUID: &str = r"(?i:[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})";

struct Postman {
    client: Client,
    job: Mutex<Option<(String, CancellationToken)>>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Response {
    status: u16,
    retry_after: Option<String>,
    data: Option<Value>,
}

fn route_allowed(route: &str) -> bool {
    static SIMPLE: OnceLock<Regex> = OnceLock::new();
    let simple = SIMPLE.get_or_init(|| {
        Regex::new(&format!(
            r"\A(?:/workspaces/{UUID}(?:/global-variables)?|/(?:collections|environments)/(?:[0-9]{{1,20}}-)?{UUID}|/environments\?workspace={UUID})\z"
        )).expect("valid route pattern")
    });
    if simple.is_match(route) {
        return true;
    }

    static COLLECTIONS: OnceLock<Regex> = OnceLock::new();
    let collections = COLLECTIONS.get_or_init(|| {
        Regex::new(&format!(
            r"\A/collections\?workspace={UUID}&limit=([0-9]{{1,3}})&offset=([0-9]{{1,6}})\z"
        )).expect("valid collection list pattern")
    });
    let Some(parts) = collections.captures(route) else {
        return false;
    };
    fn number(parts: &Captures<'_>, index: usize) -> u32 {
        parts[index].parse().expect("decimal digits")
    }
    (1..=100).contains(&number(&parts, 1)) && number(&parts, 2) <= 50_000
}

#[tauri::command]
fn begin_backup(state: State<'_, Postman>, job: String) -> Result<(), &'static str> {
    let mut current = state.job.lock().map_err(|_| "Desktop backup unavailable.")?;
    if let Some((_, token)) = current.take() {
        token.cancel();
    }
    *current = Some((job, CancellationToken::new()));
    Ok(())
}

#[tauri::command]
fn cancel_backup(state: State<'_, Postman>, job: String) -> Result<(), &'static str> {
    let mut current = state.job.lock().map_err(|_| "Desktop backup unavailable.")?;
    if current.as_ref().is_some_and(|(id, _)| id == &job) {
        if let Some((_, token)) = current.take() {
            token.cancel();
        }
    }
    Ok(())
}

#[tauri::command]
async fn postman_get(
    state: State<'_, Postman>,
    job: String,
    route: String,
    api_key: String,
) -> Result<Response, &'static str> {
    if !route_allowed(&route) || api_key.is_empty() || api_key.len() > 256
        || !api_key.bytes().all(|character| (0x21..=0x7e).contains(&character))
    {
        return Err("Invalid Postman request.");
    }
    let token = state.job.lock().map_err(|_| "Desktop backup unavailable.")?
        .as_ref().filter(|(id, _)| id == &job).map(|(_, token)| token.clone())
        .ok_or("Backup cancelled.")?;
    let request = async {
        let mut response = state.client.get(format!("{ORIGIN}{route}"))
            .header("X-Api-Key", api_key)
            .header(ACCEPT, "application/json")
            .send().await.map_err(transport_error)?;
        let status = response.status().as_u16();
        let retry_after = response.headers().get(RETRY_AFTER)
            .and_then(|value| value.to_str().ok()).map(str::to_owned);
        let data = if response.status().is_success() {
            if !response.headers().get(CONTENT_TYPE).and_then(|value| value.to_str().ok())
                .is_some_and(|value| value.contains("application/json"))
            {
                return Err("Postman returned an unexpected response type.");
            }
            if response.content_length().is_some_and(|length| length > MAX_RESPONSE as u64) {
                return Err("A Postman response exceeds the per-item size limit.");
            }
            let mut bytes = Vec::new();
            while let Some(chunk) = response.chunk().await.map_err(transport_error)? {
                if bytes.len() + chunk.len() > MAX_RESPONSE {
                    return Err("A Postman response exceeds the per-item size limit.");
                }
                bytes.extend_from_slice(&chunk);
            }
            Some(serde_json::from_slice(&bytes).map_err(|_| "Postman returned invalid JSON.")?)
        } else {
            None
        };
        Ok(Response { status, retry_after, data })
    };
    tokio::select! {
        biased;
        _ = token.cancelled() => Err("Backup cancelled."),
        result = request => result,
    }
}

fn transport_error(error: reqwest::Error) -> &'static str {
    if error.is_timeout() {
        "The Postman request timed out."
    } else {
        "The desktop app could not reach Postman."
    }
}

#[tauri::command]
async fn save_zip(app: AppHandle, request: Request<'_>) -> Result<bool, &'static str> {
    let InvokeBody::Raw(bytes) = request.body() else {
        return Err("Invalid ZIP data.");
    };
    if bytes.len() > MAX_ZIP || !bytes.starts_with(b"PK\x03\x04") {
        return Err("Invalid ZIP data.");
    }
    let name = request.headers().get("x-torin-filename").and_then(|value| value.to_str().ok())
        .filter(|value| value.starts_with("torin-postman-") && value.ends_with(".zip")
            && value.len() <= 96 && value.bytes().all(|byte| byte.is_ascii_alphanumeric() || b"-.".contains(&byte)))
        .unwrap_or("torin-postman-backup.zip");
    let (sender, receiver) = tokio::sync::oneshot::channel();
    app.dialog().file().set_file_name(name).add_filter("ZIP archive", &["zip"]).save_file(move |file| {
        let _ = sender.send(file);
    });
    let Some(file) = receiver.await.map_err(|_| "Could not open the save dialog.")? else {
        return Ok(false);
    };
    let path = file.into_path().map_err(|_| "Invalid destination.")?;
    let bytes = bytes.clone();
    tauri::async_runtime::spawn_blocking(move || -> std::io::Result<()> {
        let parent = path.parent().ok_or(std::io::ErrorKind::InvalidInput)?;
        let mut output = tempfile::NamedTempFile::new_in(parent)?;
        output.write_all(&bytes)?;
        output.as_file().sync_all()?;
        output.persist(path)?;
        Ok(())
    }).await.map_err(|_| "Could not save the ZIP.")?.map_err(|_| "Could not save the ZIP.")?;
    Ok(true)
}

fn main() {
    let client = Client::builder().user_agent(concat!("TorinTools/", env!("CARGO_PKG_VERSION"))).redirect(Policy::none())
        .timeout(Duration::from_secs(25)).build().expect("create Postman HTTP client");
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(Postman { client, job: Mutex::new(None) })
        .invoke_handler(tauri::generate_handler![begin_backup, postman_get, cancel_backup, save_zip, version::check_version])
        .run(tauri::generate_context!())
        .expect("run Torin Tools");
}
