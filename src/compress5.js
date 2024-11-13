/*
 * compress.js
 * A module that compresses an image.
 * compress(httpRequest, httpResponse, ReadableStream);
 */
import sharp from 'sharp';
import redirect from './redirect.js';
sharp.cache(false);
sharp.concurrency(1);

//const sharpStream = () => sharp({ unlimited: true });

function compress(req, res, input) {
  let format = 'jpeg';

  /*
   * Determine the uncompressed image size when there's no content-length header.
   */

  /*
   * input.pipe => sharp (The compressor) => Send to httpResponse
   * The following headers:
   * |  Header Name  |            Description            |           Value            |
   * |---------------|-----------------------------------|----------------------------|
   * |x-original-size|Original photo size                |OriginSize                  |
   * |x-bytes-saved  |Saved bandwidth from original photo|OriginSize - Compressed Size|
   */

  input.pipe(sharp()
    .resize(null, 12480, {
        withoutEnlargement: true
      })
    .grayscale(req.params.grayscale)
    .toFormat(format, {
      quality: req.params.quality,
      progressive: true, // Enable progressive JPEG
      chromaSubsampling: '4:2:0', // Default chroma subsampling
      optimiseCoding: true, // Optimise Huffman coding tables
      trellisQuantisation: false, // Disable trellis quantisation to reduce CPU usage
      overshootDeringing: false, // Disable overshoot deringing to reduce CPU usage
      optimiseScans: false, // Disable optimisation of progressive scans to reduce CPU usage
      quantisationTable: 0 // Use default quantisation table
      //effort: 0
    })
    .on('error', (err) => {
      console.error('Sharp error:', err.message || err);
      return redirect(req, res);
    })
    .on('info', (info) => {
      res.setHeader('content-type', 'image/' + format);
      res.setHeader('content-length', info.size);
      res.setHeader('x-original-size', req.params.originSize);
      res.setHeader('x-bytes-saved', req.params.originSize - info.size);
      res.status(200);
    })
  ).pipe(res);
}

export default compress;
