use crate::handlers::transform_image_handler;
use actix_cors::Cors;
use actix_web::middleware::Logger;
use actix_web::{App, HttpServer};
use actix_web_lab::web::spa;
use anyhow::{Context, Result};

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
            .service(
                spa()
                    .index_file("./static/index.html")
                    .static_resources_mount("/")
                    .static_resources_location("./static")
                    .finish(),
            )
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
    .context("Failed to start an HTTP server")
}
