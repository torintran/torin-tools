use reqwest::{header, redirect::Policy, Client, Url};
use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Deserialize, Serialize)]
pub struct VersionManifest {
    version: String,
}

#[tauri::command]
pub async fn check_version() -> Result<Option<VersionManifest>, &'static str> {
    const ERROR: &str = "Could not check for updates.";
    let Some(configured) = option_env!("TORIN_UPDATE_URL").filter(|value| !value.is_empty()) else {
        return Ok(None);
    };
    let url = Url::parse(configured).map_err(|_| ERROR)?;
    if url.scheme() != "https"
        || url.host_str().is_none()
        || !url.username().is_empty()
        || url.password().is_some()
        || url.query().is_some()
        || url.fragment().is_some()
        || !url.path().ends_with("/version.json")
    {
        return Err(ERROR);
    }

    let client = Client::builder()
        .timeout(Duration::from_secs(5))
        .redirect(Policy::none())
        .build()
        .map_err(|_| ERROR)?;
    let mut response = client
        .get(url)
        .header(header::ACCEPT, "application/json")
        .send()
        .await
        .map_err(|_| ERROR)?;
    if !response.status().is_success()
        || response.content_length().is_some_and(|length| length > 2048)
    {
        return Err(ERROR);
    }
    let mut bytes = Vec::new();
    while let Some(chunk) = response.chunk().await.map_err(|_| ERROR)? {
        if bytes.len() + chunk.len() > 2048 {
            return Err(ERROR);
        }
        bytes.extend_from_slice(&chunk);
    }
    serde_json::from_slice(&bytes).map(Some).map_err(|_| ERROR)
}
