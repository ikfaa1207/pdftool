import fitz

def create_pdf():
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)  # Letter size
    
    text = """CONFIDENTIAL B2B SUPPORT WORKFLOW DOCUMENT

Client Company: Acme Corp
Support Agent: John Doe (email: john.doe@acme-support.com, phone: +1-555-0199)
Client Account Representative: Jane Smith (email: jane.smith@client-acme.org)

Tax ID Details:
Acme Corp EIN: 12-3456789
Primary Account Holder SSN: 123-45-6789

Billing & Invoicing:
Corporate Visa Card: 4111-2222-3333-4444
Payment Gateway IP Address: 192.168.1.105

Please review this document for accuracy. If any information is incorrect, contact support immediately.
"""
    
    # We use insert_textbox to wrap lines automatically
    rect = fitz.Rect(50, 50, 562, 742)
    page.insert_textbox(rect, text, fontsize=12, fontname="helv")
    
    doc.save("test_document.pdf")
    doc.close()
    print("Created test_document.pdf successfully.")

if __name__ == "__main__":
    create_pdf()
