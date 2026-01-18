import io
import requests
from bs4 import BeautifulSoup
from pypdf import PdfReader

def extract_text_from_pdf(file_content: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_content))
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text.strip()

def extract_text_from_url(url: str) -> str:
    response = requests.get(url)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Remove script and style elements
    for script in soup(["script", "style"]):
        script.extract()
        
    # Get text
    text = soup.get_text()
    
    # Break into lines and remove leading and trailing space on each
    lines = (line.strip() for line in text.splitlines())
    # Break multi-headlines into a line each
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    # Drop blank lines
    text = '\n'.join(chunk for chunk in chunks if chunk)
    
    return text
