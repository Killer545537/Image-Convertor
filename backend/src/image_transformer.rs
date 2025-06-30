use anyhow::{Context, Result};
use image::{DynamicImage, ImageFormat, ImageReader};
use serde::Deserialize;
use std::fs::File;
use std::io::{BufReader, Cursor};
use std::path::Path;

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
    fn load_image(path: &Path) -> Result<DynamicImage> {
        let file = File::open(path)?;
        let img = ImageReader::new(BufReader::new(file))
            .with_guessed_format()?
            .decode()
            .context("Invalid data")?;
        Ok(img)
    }

    fn write_image_to_png_buffer(img: &DynamicImage) -> Result<Vec<u8>> {
        let mut buffer = Cursor::new(Vec::new());
        img.write_to(&mut buffer, ImageFormat::Png)
            .context("Could not write to buffer")?;
        Ok(buffer.into_inner())
    }

    pub fn transform_image_from_path<F>(path: &Path, mut ops: Vec<F>) -> Result<Vec<u8>>
    where
        F: FnMut(DynamicImage) -> DynamicImage,
    {
        let mut img = Self::load_image(path)?;
        for op in ops.iter_mut() {
            img = op(img);
        }

        Self::write_image_to_png_buffer(&img)
    }
}
