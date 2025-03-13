import express, { Request, Response } from 'express';
import { monitoring } from './utils/monitor';
const app = express();
const port = 3000;
import fs from 'fs';
import path from 'path';
import puppeteer, { PDFOptions } from 'puppeteer';
import Stream, { Readable } from 'node:stream';

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.get('/pdf', async (req: Request, res: Response) => {
  const htmlPath = path.join(__dirname, '../pdf', 'temp.html');
  const pdfPath = path.join(__dirname, '../pdf', 'output.pdf');

  const options = {
    format: 'A4',
    margin: {
      top: '100px',
      bottom: '50px',
    },
    printBackground: false,
    timeout: 0,
    protocolTimeout: 1800000,
  };

  const browser = await puppeteer.launch({
    headless: 'shell',
    args: [
      '--headless',
      '--disable-gpu',
      '--full-memory-crash-report',
      '--unlimited-storage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
    pipe: true,
    protocolTimeout: 1800000,
  });
  const page = await browser.newPage();

  await page.goto(`file://${htmlPath}`, {
    waitUntil: ['networkidle0'],
    timeout: 0,
  });
  await page.evaluate(() => {
    window.scrollBy(0, window.innerHeight);
  });
  const contentHeight = await page.evaluate(() => {
    return document.documentElement.scrollHeight;
  });
  const pageHeight = 1122; // Approx. height of an A4 page in pixels at 96 DPI
  const topMargin = 100; // Top margin in pixels
  const bottomMargin = 50; // Bottom margin in pixels
  const effectivePageHeight = pageHeight - topMargin - bottomMargin; // Effective height of the content area

  // Calculate estimated pages
  const estimatedPages = Math.ceil(contentHeight / effectivePageHeight);
  console.log(`Estimated pages: ${estimatedPages}`);

  console.log('Start creating Pdf...');
  const pdfStream = await page.createPDFStream(options as PDFOptions);
  const fileStream = Stream.Writable.toWeb(fs.createWriteStream(pdfPath));

  try {
    await pdfStream.pipeTo(fileStream);
  } catch (e) {
    console.log(e);
  } finally {
    // fileStream.close();
    await browser.close();
  }

  // const passThrough = new Stream.PassThrough();

  // const reader = pdfStream.getReader();

  // async function pump() {
  //   while (true) {
  //     const { done, value } = await reader.read();
  //     if (done) {
  //       passThrough.end(); // Close the stream when done
  //       break;
  //     }
  //     passThrough.write(value); // Write chunk to PassThrough
  //   }
  // }

  // passThrough.on('data', (chunk) => {
  //   console.log('Received chunk:', chunk.length, 'bytes');
  // });
  // passThrough.on('error', (err) => {
  //   console.error('Error during passThrough', err);
  // });

  // pump();

  res.status(200).send('PDF generated successfully');
});

app.listen(port, () => {
  monitoring('Main', 2000);
  console.log(`Server started on http://localhost:${port}`);
});
