use anyhow::{Context, Result};
use image::{load_from_memory, DynamicImage, ImageFormat};
use serde::Deserialize;
use std::io::Cursor;

#[derive(Deserialize, Debug)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Transformation {
    Invert,
    Grayscale,
    Rotate { direction: String },
    Resize { percent: f32 },
}

pub struct ImageTransformer;

impl ImageTransformer {
    fn write_image_to_png_buffer(img: &DynamicImage) -> Result<Vec<u8>> {
        let mut buffer = Cursor::new(Vec::new());
        img.write_to(&mut buffer, ImageFormat::Png)
            .context("Could not write to buffer")?;
        Ok(buffer.into_inner())
    }

    pub fn transform_image_from_bytes<F>(bytes: &[u8], mut ops: Vec<F>) -> Result<Vec<u8>>
    where
        F: FnMut(DynamicImage) -> DynamicImage,
    {
        let mut img = load_from_memory(bytes)?;
        for op in ops.iter_mut() {
            img = op(img);
        }

        Self::write_image_to_png_buffer(&img)
    }
}
