import { describe, it, expect } from "vitest";
import { htmlToPdf } from "api/util/htmlToPdf.js"; 

describe("htmlToPdf", () => {
  it("generates a PDF from HTML content", async () => {
    const htmlContent = "<h1>Test PDF</h1><p>This is a test PDF.</p>";
    
    const pdf = await htmlToPdf(htmlContent);

    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.length).toBeGreaterThan(0);
  });
});
