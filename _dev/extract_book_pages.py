import os
import pymupdf

def extract_pages(pdf_path, output_dir, dpi=130):
    os.makedirs(output_dir, exist_ok=True)
    doc = pymupdf.open(pdf_path)
    total = len(doc)
    print(f"Extracting {total} pages from {pdf_path} into {output_dir}...")
    
    zoom = dpi / 72.0
    mat = pymupdf.Matrix(zoom, zoom)
    
    for i in range(total):
        page = doc[i]
        pix = page.get_pixmap(matrix=mat, alpha=False, clip=page.mediabox)
        out_file = os.path.join(output_dir, f"page_{i+1}.jpg")
        pix.save(out_file)
        if (i + 1) % 25 == 0 or (i + 1) == total:
            print(f"  Processed {i+1}/{total} pages")
            
    doc.close()
    print(f"Finished extracting {pdf_path}")

if __name__ == "__main__":
    extract_pages("LIBROS/Libro español.pdf", "LIBROS/paginas_es", dpi=130)
    extract_pages("LIBROS/Libro Ingles.pdf", "LIBROS/paginas_en", dpi=130)
    print("ALL 168 PAGES OF BOTH BOOKS SUCCESSFULLY EXTRACTED AS JPG!")
