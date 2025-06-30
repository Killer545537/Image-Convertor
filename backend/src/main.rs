use actix_cors::Cors;
use actix_web::{App, HttpServer};
use actix_web::middleware::Logger;
use anyhow::{Context, Result};
use crate::handlers::transform_image_handler;

mod handlers;
mod image_transformer;

#[actix_web::main]
async fn main() -> Result<()> {
    env_logger::init();
    println!("Server running at http://localhost:8080 ...");
    HttpServer::new(move || {
        App::new()
            .wrap(Logger::default())
            .wrap(Cors::default().allow_any_origin())
            .service(transform_image_handler)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
    .context("Failed to start an HTTP server")
}
