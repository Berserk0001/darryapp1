/*
 * compress.js
 * A module that compresses an image.
 * compress(httpRequest, httpResponse, ReadableStream);
 */
import sharp from 'sharp';
import redirect from './redirect.js';
sharp.cache(false);
sharp.concurrency(1);

function compress(req, res, input) {
  let format = 'webp';

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

  input.pipe(
    sharp({ unlimited: true })
      .resize(null, 12480, {
        withoutEnlargement: true,
      })
      .grayscale(req.params.grayscale)
      .toFormat(format, {
        quality: req.params.quality,
        effort: 0, // Set effort to a lower value to reduce CPU usage
        smartSubsample: true, // Enable smart subsampling to reduce CPU usage
      })
      .withMetadata(false) // Strips metadata
      .on('error', (err) => {
        console.error('Sharp error:', err.message || err);
        return redirect(req, res);
      })
      .on('info', (info) => {
        res.setHeader('content-type', 'image/' + format);
        if (info.size) {
          res.setHeader('content-length', info.size);
        }
        res.setHeader('x-original-size', req.params.originSize);
        res.setHeader('x-bytes-saved', req.params.originSize - info.size);
        res.status(200);
      })
  ).pipe(res);
}

export default compress;