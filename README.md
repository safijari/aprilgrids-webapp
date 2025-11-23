# AprilTags Grid Generator

A static web application for generating AprilTag calibration targets for camera calibration.

## Features

- Generate customizable AprilTag grids
- Support for multiple tag families:
  - **t36h11** (36 bits, HD=11) - 587 tags available
  - **t25h9** (25 bits, HD=9) - 35 tags available
  - **t25h7** (25 bits, HD=7) - 242 tags available
  - **t16h5** (16 bits, HD=5) - 30 tags available
- Configurable grid parameters:
  - Number of columns and rows
  - Tag size (in meters)
  - Tag spacing (as fraction of tag size)
- Real-time preview on canvas
- Download options:
  - High-resolution PNG (3x resolution for printing)
  - SVG (vector format)
- Coordinate axes display (x in red, y in green)
- Symmetric corner squares for improved motion blur resistance

## Usage

### Running Locally

Simply open `index.html` in a web browser. No server required!

Or use a simple HTTP server:

```bash
python3 -m http.server 8080
# Then open http://localhost:8080
```

### Configuration Parameters

1. **Tag Family**: Select the AprilTag family to use
   - Higher bit counts (e.g., t36h11) provide more robust detection
   - Hamming distance (HD) indicates error correction capability

2. **Grid Size**: Number of tags in columns and rows
   - Note: Some families have limited available tags (e.g., t16h5 has only 30)

3. **Tag Size**: Physical size of one tag in meters
   - Default: 0.02m (2cm)
   - This should match your intended print size

4. **Tag Spacing**: Space between tags as a fraction of tag size
   - Range: 0-1
   - Default: 0.25 (25% of tag size)
   - Spacing adds symmetric corner squares for better detection

### Downloading

1. Click **"Generate Preview"** to create your grid
2. Choose download format:
   - **Download PNG**: High-resolution raster image (3x canvas resolution)
   - **Download SVG**: Vector format with embedded image

### Printing

For accurate calibration:
1. Use the PNG download for best quality
2. Print at actual size (disable "fit to page")
3. Use high-quality printer settings
4. Measure printed tags to verify size matches configuration
5. Mount on flat, rigid surface

## Technical Details

Based on the Python implementation from [apriltags2_ethz](https://github.com/safijari/apriltags2_ethz):
- `createTargetPDF.py` - Grid generation logic
- `tagFamilies.py` - Tag family codes

### Tag Structure

Each AprilTag consists of:
- Black border (2 bits wide)
- Data bits encoding the tag ID
- White/black pattern based on tag family
- Symmetric corner squares at grid intersections

### Coordinate System

- Origin at top-left corner of first tag
- X-axis (red) points right
- Y-axis (green) points down

## Browser Compatibility

Works in all modern browsers with HTML5 Canvas support:
- Chrome/Edge
- Firefox
- Safari

## License

This is based on AprilTags codes from the MIT CSAIL project.