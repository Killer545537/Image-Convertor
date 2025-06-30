use crate::image_transformer::{ImageTransformer, Transformation};
use actix_multipart::form::MultipartForm;
use actix_multipart::form::tempfile::TempFile;
use actix_multipart::form::text::Text;
use actix_web::{HttpResponse, Responder, post};
use image::{DynamicImage, GenericImageView};

#[derive(MultipartForm)]
struct TransformForm {
    file: TempFile,
    transformations: Text<String>,
}

#[post("/transform")]
async fn transform_image_handler(
    MultipartForm(form): MultipartForm<TransformForm>,
) -> impl Responder {
    let transformations: Vec<Transformation> = match serde_json::from_str(&form.transformations) {
        Ok(t) => t,
        Err(e) => {
            return HttpResponse::BadRequest().body(format!("Invalid transformations JSON: {e}"));
        }
    };

    println!("{:?}", transformations);

    let mut ops: Vec<Box<dyn FnMut(DynamicImage) -> DynamicImage>> = Vec::new();
    for t in &transformations {
        match t {
            Transformation::Invert => {
                ops.push(Box::new(|mut img| {
                    img.invert();
                    img
                }));
            }
            Transformation::Grayscale => {
                ops.push(Box::new(|img| img.grayscale()));
            }
            Transformation::Rotate { direction } => {
                let dir = direction.clone();
                ops.push(Box::new(move |img| match dir.as_str() {
                    "left" => img.rotate270(),
                    "right" => img.rotate90(),
                    "" => img,
                    _ => img,
                }));
            }
            Transformation::Resize { percent } => {
                let p = *percent;
                ops.push(Box::new(move |img| {
                    let (w, h) = img.dimensions();
                    let nw = ((w as f32) * p / 100.0).round() as u32;
                    let nh = ((h as f32) * p / 100.0).round() as u32;
                    img.resize(nw, nh, image::imageops::Lanczos3)
                }));
            }
        }
    }

    match ImageTransformer::transform_image_from_path(form.file.file.path(), ops) {
        Ok(buf) => HttpResponse::Ok().content_type("image/png").body(buf),
        Err(e) => HttpResponse::InternalServerError().body(format!("Image processing failed: {e}")),
    }
}
