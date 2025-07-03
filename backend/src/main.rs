use crate::handlers::transform_image_handler;
use actix_web::{App, HttpServer};
use actix_web_lab::web::spa;
use anyhow::{Context, Result};

mod handlers;
mod image_transformer;

#[actix_web::main]
async fn main() -> Result<()> {
    println!("Server running at http://localhost:8080 ...");
    HttpServer::new(move || {
        App::new().service(transform_image_handler).service(
            spa()
                .index_file("./static/index.html")
                .static_resources_mount("/")
                .static_resources_location("./static")
                .finish(),
        )
    })
    .bind(("0.0.0.0", 8080))?
    .workers(2)
    .run()
    .await
    .context("Failed to start an HTTP server")
}
