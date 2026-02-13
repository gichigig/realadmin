import Tesseract from "tesseract.js";

export interface IDScanResult {
  success: boolean;
  idNumber: string | null;
  serialNumber: string | null;
  fullNames: string | null;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  dateOfBirth: string | null;
  sex: string | null;
  districtOfBirth: string | null;
  placeOfIssue: string | null;
  dateOfIssue: string | null;
  fullText: string;
  errors: string[];
  warnings: string[];
  confidence: number;
}

/**
 * Preprocess image for better OCR results
 * Applies contrast enhancement and grayscale conversion
 */
async function preprocessImage(imageFile: File | string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        resolve(typeof imageFile === "string" ? imageFile : URL.createObjectURL(imageFile));
        return;
      }
      
      // Set canvas size to image size
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw original image
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Convert to grayscale and enhance contrast
      for (let i = 0; i < data.length; i += 4) {
        // Grayscale
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        
        // Contrast enhancement (increase contrast by 30%)
        const factor = 1.3;
        const adjusted = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
        
        // Apply threshold for better text recognition
        const threshold = adjusted > 140 ? 255 : adjusted < 100 ? 0 : adjusted;
        
        data[i] = threshold;
        data[i + 1] = threshold;
        data[i + 2] = threshold;
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    
    img.onerror = () => {
      resolve(typeof imageFile === "string" ? imageFile : URL.createObjectURL(imageFile));
    };
    
    if (typeof imageFile === "string") {
      img.src = imageFile;
    } else {
      img.src = URL.createObjectURL(imageFile);
    }
  });
}

/**
 * Fix common OCR mistakes in numbers
 */
function fixOCRNumbers(text: string): string {
  return text
    .replace(/[oO]/g, "0")
    .replace(/[lI|]/g, "1")
    .replace(/[zZ]/g, "2")
    .replace(/[sS]/g, "5")
    .replace(/[bB]/g, "8");
}

/**
 * Kenyan National ID Card Structure:
 * 
 * JAMHURI YA KENYA                    REPUBLIC OF KENYA
 * SERIAL NUMBER: XXXXXXXXX            ID NUMBER: XXXXXXXX
 * 
 * Format 1 (Older IDs):
 * FULL NAMES
 * [FIRST NAME] [MIDDLE NAME] [LAST NAME]
 * 
 * Format 2 (Newer IDs):
 * SURNAME
 * [LAST NAME]
 * GIVEN NAME
 * [FIRST NAME] [MIDDLE NAME]
 * 
 * DATE OF BIRTH
 * DD.MM.YYYY
 * 
 * SEX
 * MALE/FEMALE
 * 
 * DISTRICT OF BIRTH
 * [DISTRICT NAME]
 * 
 * PLACE OF ISSUE
 * [PLACE]
 * 
 * DATE OF ISSUE
 * DD.MM.YYYY
 */

// Kenyan ID patterns - ID number is 7-8 digits
const ID_NUMBER_PATTERNS = [
  /ID\s*NUMBER\s*[:\.]?\s*(\d{7,8})/gi,
  /ID\s*NO\s*[:\.]?\s*(\d{7,8})/gi,
  /IDNUMBER\s*[:\.]?\s*(\d{7,8})/gi,
  /ID[:\.]?\s*(\d{7,8})/gi,
  /NUMBER\s*[:\.]?\s*(\d{7,8})/gi,
  // OCR error patterns (O->0, I->1, etc.)
  /ID\s*NUMBER\s*[:\.]?\s*([0-9OoIlZzSsBb]{7,8})/gi,
  /ID\s*NO\s*[:\.]?\s*([0-9OoIlZzSsBb]{7,8})/gi,
  // Common OCR misreads for "ID NUMBER" -> "omens", "omen", "id num", etc.
  /[o0][mn]e?[mn]s?\s*[:\.]?\s*(\d{7,8})/gi,
  // Pattern: 9 digit serial followed by anything then 7-8 digit ID
  /\d{9}\s+\S+\s+(\d{7,8})/gi,
];

// Serial number is typically 9 digits
const SERIAL_NUMBER_PATTERNS = [
  /SERIAL\s*NUMBER\s*[:\.]?\s*(\d{8,9})/gi,
  /SERIAL\s*NO\s*[:\.]?\s*(\d{8,9})/gi,
  /SERIALNUMBER\s*[:\.]?\s*(\d{8,9})/gi,
  // Common OCR misreads: "SERIAL" -> "sea", "ser", "seri", "senal"
  /se[ar]i?[an]?l?\s*n[o0u]m[bs]?e?r?\s*[:\.]?\s*(\d{8,9})/gi,
  // OCR misread: "sea nomser" 
  /sea\s*n[o0]m[bs]e?r?\s*[:\.]?\s*(\d{8,9})/gi,
];

// Kenyan ID uses DD.MM.YYYY format
const DATE_PATTERNS = [
  /(\d{1,2})\.(\d{1,2})\.(\d{4})/g,           // DD.MM.YYYY (most common in Kenyan IDs)
  /(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/g,     // DD. MM. YYYY (with spaces - OCR artifact)
  /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g,   // DD/MM/YYYY or DD-MM-YYYY
  /(\d{1,2})\s+(\d{1,2})\s+(\d{4})/g,         // DD MM YYYY (if OCR misses dots)
  /(\d{1,2})\s*[,\.]\s*(\d{1,2})\s*[,\.]\s*(\d{4})/g, // Various OCR punctuation
];

// Words to exclude from name detection
const EXCLUDED_WORDS = [
  "JAMHURI", "YA", "KENYA", "REPUBLIC", "OF", "THE", "AND", "FOR",
  "SERIAL", "NUMBER", "ID", "FULL", "NAMES", "NAME", "DATE", "BIRTH",
  "SEX", "MALE", "FEMALE", "DISTRICT", "PLACE", "ISSUE", "HOLDER",
  "SIGN", "SIGNATURE", "NATIONAL", "IDENTITY", "CARD", "GOK",
  "DIVISION", "LOCATION", "SOUTH", "NORTH", "EAST", "WEST", "CENTRAL",
  "BORN", "DOB", "ISSUED", "SURNAME", "SURNAMES", "GIVEN", "GIVENNAME",
  "GIVENNAMES"
];

/**
 * Extract ID number from Kenyan ID (7-8 digits, typically near "ID NUMBER" text)
 */
function extractIDNumber(text: string, lines: string[]): string | null {
  // First try to find ID NUMBER pattern explicitly
  for (const pattern of ID_NUMBER_PATTERNS) {
    const regex = new RegExp(pattern);
    let match;
    while ((match = regex.exec(text)) !== null) {
      let idNum = match[1];
      // Fix common OCR mistakes
      idNum = fixOCRNumbers(idNum);
      if (idNum && idNum.length >= 7 && idNum.length <= 8 && /^\d+$/.test(idNum)) {
        return idNum;
      }
    }
  }
  
  // Look for 7-8 digit numbers on lines containing "ID" 
  for (const line of lines) {
    const upperLine = line.toUpperCase();
    if (upperLine.includes("ID") && !upperLine.includes("SERIAL")) {
      // Try with OCR fix
      const fixedLine = fixOCRNumbers(line);
      const numMatch = fixedLine.match(/\b(\d{7,8})\b/);
      if (numMatch) {
        return numMatch[1];
      }
    }
  }
  
  // Look for any 7-8 digit number in the top portion of the ID
  const topLines = lines.slice(0, Math.min(8, lines.length));
  for (const line of topLines) {
    const fixedLine = fixOCRNumbers(line);
    // Find all numbers on the line
    const allNums = fixedLine.match(/\b\d{7,9}\b/g);
    if (allNums) {
      // If there's a 9-digit (serial) and 7-8 digit (ID) on same line, return the ID
      for (const num of allNums) {
        if (num.length === 7 || num.length === 8) {
          return num;
        }
      }
    }
  }
  
  // Last resort: find any 7-8 digit sequence in entire text
  const fixedText = fixOCRNumbers(text);
  const allNumbers = fixedText.match(/\b\d{7,8}\b/g);
  if (allNumbers && allNumbers.length > 0) {
    // Return the first one that's not likely a serial number (9 digits)
    for (const num of allNumbers) {
      if (num.length === 7 || num.length === 8) {
        return num;
      }
    }
  }

  return null;
}

/**
 * Extract Serial Number from Kenyan ID (8-9 digits)
 */
function extractSerialNumber(text: string, lines: string[]): string | null {
  for (const pattern of SERIAL_NUMBER_PATTERNS) {
    const regex = new RegExp(pattern);
    let match;
    while ((match = regex.exec(text)) !== null) {
      const serialNum = match[1];
      if (serialNum && serialNum.length >= 8 && serialNum.length <= 9) {
        return serialNum;
      }
    }
  }
  
  // Look for 8-9 digit numbers on lines containing "SERIAL" or OCR variants
  for (const line of lines) {
    const upperLine = line.toUpperCase();
    // Check for "SERIAL", "SER", "SEA" (common OCR misread)
    if (upperLine.includes("SERIAL") || upperLine.includes("SEA ") || /\bSE[AR]/i.test(line)) {
      const numMatch = line.match(/\b(\d{8,9})\b/);
      if (numMatch) {
        return numMatch[1];
      }
    }
  }

  // Look on the header line (typically second or third line) for 9-digit number
  // Kenyan IDs have: SERIAL NUMBER: XXXXXXXXX   ID NUMBER: XXXXXXXX on same line
  const topLines = lines.slice(0, Math.min(5, lines.length));
  for (const line of topLines) {
    // Find all numbers and look for a 9-digit one
    const allNums = line.match(/\d{8,9}/g);
    if (allNums) {
      for (const num of allNums) {
        if (num.length === 9) {
          return num;
        }
      }
    }
  }

  return null;
}

/**
 * Extract Date of Birth from Kenyan ID
 * Kenyan IDs use DD.MM.YYYY format
 */
function extractDateOfBirth(text: string, lines: string[]): string | null {
  // First, look for date immediately after "DATE OF BIRTH" or "DOB"
  const dobLineIndex = lines.findIndex(line => {
    const upper = line.toUpperCase();
    return upper.includes("DATE OF BIRTH") || upper.includes("DOB") || upper === "DATE" || upper.includes("BIRTH");
  });
  
  if (dobLineIndex !== -1) {
    // Check current line and next few lines for a date
    for (let i = dobLineIndex; i < Math.min(dobLineIndex + 3, lines.length); i++) {
      const line = lines[i];
      for (const pattern of DATE_PATTERNS) {
        const regex = new RegExp(pattern);
        const match = regex.exec(line);
        if (match) {
          const day = match[1].padStart(2, "0");
          const month = match[2].padStart(2, "0");
          const year = match[3];
          
          // Validate it's a reasonable birth year (1920-2015)
          const yearNum = parseInt(year);
          if (yearNum >= 1920 && yearNum <= 2015) {
            return `${year}-${month}-${day}`;
          }
        }
      }
    }
  }

  // Fallback: look for first date in document that could be a birth date
  for (const pattern of DATE_PATTERNS) {
    const regex = new RegExp(pattern);
    let match;
    while ((match = regex.exec(text)) !== null) {
      const day = match[1].padStart(2, "0");
      const month = match[2].padStart(2, "0");
      const year = match[3];
      
      const yearNum = parseInt(year);
      // Birth year should be reasonable (1920-2015)
      if (yearNum >= 1920 && yearNum <= 2015) {
        return `${year}-${month}-${day}`;
      }
    }
  }

  return null;
}

/**
 * Extract Date of Issue from Kenyan ID
 */
function extractDateOfIssue(text: string, lines: string[]): string | null {
  // Find "DATE OF ISSUE" or "ISSUED" line
  const issueLineIndex = lines.findIndex(line => {
    const upper = line.toUpperCase();
    return upper.includes("DATE OF ISSUE") || upper.includes("ISSUED") || 
           (upper.includes("ISSUE") && !upper.includes("PLACE"));
  });
  
  if (issueLineIndex !== -1) {
    // Check current line and next few lines for a date
    for (let i = issueLineIndex; i < Math.min(issueLineIndex + 3, lines.length); i++) {
      const line = lines[i];
      for (const pattern of DATE_PATTERNS) {
        const regex = new RegExp(pattern);
        const match = regex.exec(line);
        if (match) {
          const day = match[1].padStart(2, "0");
          const month = match[2].padStart(2, "0");
          const year = match[3];
          
          // Issue year should be recent (2000-2030)
          const yearNum = parseInt(year);
          if (yearNum >= 2000 && yearNum <= 2030) {
            return `${year}-${month}-${day}`;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Extract Full Names from Kenyan ID
 * Supports two formats:
 * 1. "FULL NAMES" label with name below it (older format)
 * 2. "SURNAME" and "GIVEN NAME" labels with respective names below them (newer format)
 */
function extractFullNames(text: string, lines: string[]): { 
  fullNames: string | null; 
  firstName: string | null; 
  middleName: string | null; 
  lastName: string | null;
} {
  // Helper function to clean and validate a name string
  const cleanName = (name: string): string => {
    return name
      .replace(/[^A-Za-z'\s-]/g, " ") // Remove non-letter chars except apostrophe and hyphen
      .replace(/\s+/g, " ")            // Normalize spaces
      .trim()
      .toUpperCase();
  };

  // Helper function to check if a string looks like a valid name
  const isValidName = (name: string): boolean => {
    return name.length >= 2 && /^[A-Z'\s-]+$/.test(name) && 
           !EXCLUDED_WORDS.includes(name);
  };

  // Try Format 2 first: SURNAME and GIVEN NAME labels (newer Kenyan ID format)
  const surnameLineIndex = lines.findIndex(line => {
    const upper = line.toUpperCase().trim();
    return upper === "SURNAME" || upper === "SURNAMES" || 
           upper.startsWith("SURNAME") && upper.length < 15;
  });
  
  const givenNameLineIndex = lines.findIndex(line => {
    const upper = line.toUpperCase().trim();
    return upper === "GIVEN NAME" || upper === "GIVEN NAMES" || 
           upper === "GIVENNAME" || upper === "GIVENNAMES" ||
           upper.startsWith("GIVEN NAME") && upper.length < 20;
  });

  if (surnameLineIndex !== -1 || givenNameLineIndex !== -1) {
    let surname: string | null = null;
    let givenNames: string | null = null;
    
    // Extract surname (appears below SURNAME label)
    if (surnameLineIndex !== -1 && surnameLineIndex + 1 < lines.length) {
      const surnameCandidate = cleanName(lines[surnameLineIndex + 1]);
      if (isValidName(surnameCandidate)) {
        surname = surnameCandidate;
      }
    }
    
    // Extract given names (appears below GIVEN NAME label)
    if (givenNameLineIndex !== -1 && givenNameLineIndex + 1 < lines.length) {
      let givenNameCandidate = lines[givenNameLineIndex + 1].trim();
      
      // Check if name continues to next line (for multiple given names)
      if (givenNameLineIndex + 2 < lines.length) {
        const nextLine = lines[givenNameLineIndex + 2].trim().toUpperCase();
        // Don't include if it's another field label
        if (!nextLine.includes("DATE") && !nextLine.includes("BIRTH") && 
            !nextLine.includes("SEX") && !nextLine.includes("ID") &&
            !nextLine.includes("SURNAME") && !nextLine.includes("NUMBER") &&
            nextLine.length > 0 && nextLine.length < 30) {
          if (/^[A-Z'\s-]+$/.test(nextLine)) {
            givenNameCandidate += " " + lines[givenNameLineIndex + 2].trim();
          }
        }
      }
      
      givenNameCandidate = cleanName(givenNameCandidate);
      if (givenNameCandidate.length >= 2) {
        givenNames = givenNameCandidate;
      }
    }
    
    // If we found at least one part using the new format
    if (surname || givenNames) {
      const givenParts = givenNames ? givenNames.split(/\s+/).filter(p => p.length > 0 && !EXCLUDED_WORDS.includes(p)) : [];
      
      // Construct full name: Given Names + Surname (typical display order)
      const allParts = [...givenParts];
      if (surname) {
        allParts.push(surname);
      }
      
      return {
        fullNames: allParts.length > 0 ? allParts.join(" ") : null,
        firstName: givenParts[0] || null,
        middleName: givenParts.length > 1 ? givenParts.slice(1).join(" ") : null,
        lastName: surname,
      };
    }
  }

  // Try Format 1: "FULL NAMES" label (older format)
  const namesLineIndex = lines.findIndex(line => {
    const upper = line.toUpperCase().trim();
    return upper === "FULL NAMES" || upper === "FULL NAME" || 
           upper.includes("FULL NAMES") || upper.includes("FULLNAMES");
  });
  
  if (namesLineIndex !== -1 && namesLineIndex + 1 < lines.length) {
    // The actual name is on the next line(s)
    let nameCandidate = lines[namesLineIndex + 1].trim();
    
    // Check if the name continues to the next line (for long names)
    if (namesLineIndex + 2 < lines.length) {
      const nextLine = lines[namesLineIndex + 2].trim().toUpperCase();
      // Don't include if it's another field label
      if (!nextLine.includes("DATE") && !nextLine.includes("BIRTH") && 
          !nextLine.includes("SEX") && nextLine.length > 0) {
        // Check if it looks like a name continuation (all caps, no numbers)
        if (/^[A-Z'\s-]+$/.test(nextLine) && nextLine.length < 30) {
          nameCandidate += " " + lines[namesLineIndex + 2].trim();
        }
      }
    }
    
    // Clean up the name
    nameCandidate = cleanName(nameCandidate);
    
    // Validate it looks like a name
    if (nameCandidate.length >= 3 && /^[A-Z'\s-]+$/.test(nameCandidate)) {
      const nameParts = nameCandidate.split(/\s+/).filter(part => 
        part.length > 0 && !EXCLUDED_WORDS.includes(part)
      );
      
      if (nameParts.length >= 2) {
        return {
          fullNames: nameParts.join(" "),
          firstName: nameParts[0] || null,
          middleName: nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : null,
          lastName: nameParts[nameParts.length - 1] || null,
        };
      }
    }
  }
  
  // Fallback: look for capitalized name-like text
  const capitalizedNames = text.match(/\b[A-Z][A-Z']+(?:\s+[A-Z][A-Z']+){1,3}\b/g);
  if (capitalizedNames) {
    for (const phrase of capitalizedNames) {
      const words = phrase.split(/\s+/).filter(w => 
        w.length > 1 && !EXCLUDED_WORDS.includes(w.toUpperCase())
      );
      if (words.length >= 2 && words.length <= 4) {
        return {
          fullNames: words.join(" "),
          firstName: words[0] || null,
          middleName: words.length > 2 ? words.slice(1, -1).join(" ") : null,
          lastName: words[words.length - 1] || null,
        };
      }
    }
  }

  return { fullNames: null, firstName: null, middleName: null, lastName: null };
}

/**
 * Extract Sex from Kenyan ID
 */
function extractSex(text: string, lines: string[]): string | null {
  const sexLineIndex = lines.findIndex(line => {
    const upper = line.toUpperCase().trim();
    return upper === "SEX" || upper.includes("SEX");
  });
  
  if (sexLineIndex !== -1) {
    // Check current and next line for MALE/FEMALE
    for (let i = sexLineIndex; i < Math.min(sexLineIndex + 2, lines.length); i++) {
      const upper = lines[i].toUpperCase();
      if (upper.includes("MALE") && !upper.includes("FEMALE")) return "MALE";
      if (upper.includes("FEMALE")) return "FEMALE";
    }
  }
  
  // Fallback: search entire text
  if (/\bFEMALE\b/i.test(text)) return "FEMALE";
  if (/\bMALE\b/i.test(text)) return "MALE";
  
  return null;
}

/**
 * Extract District of Birth from Kenyan ID
 */
function extractDistrictOfBirth(text: string, lines: string[]): string | null {
  const districtLineIndex = lines.findIndex(line => {
    const upper = line.toUpperCase();
    return upper.includes("DISTRICT OF BIRTH") || upper.includes("DISTRICT");
  });
  
  if (districtLineIndex !== -1 && districtLineIndex + 1 < lines.length) {
    const districtName = lines[districtLineIndex + 1].trim();
    if (districtName.length > 1 && /^[A-Za-z\s]+$/.test(districtName)) {
      return districtName.toUpperCase();
    }
  }
  
  return null;
}

/**
 * Extract Place of Issue from Kenyan ID
 */
function extractPlaceOfIssue(text: string, lines: string[]): string | null {
  const placeLineIndex = lines.findIndex(line => {
    const upper = line.toUpperCase();
    return upper.includes("PLACE OF ISSUE");
  });
  
  if (placeLineIndex !== -1 && placeLineIndex + 1 < lines.length) {
    const placeName = lines[placeLineIndex + 1].trim();
    if (placeName.length > 1 && /^[A-Za-z\s]+$/.test(placeName)) {
      return placeName.toUpperCase();
    }
  }
  
  return null;
}

/**
 * Main function to scan a Kenyan ID card image
 */
export async function scanIDCard(
  imageFile: File | string,
  expectedFirstName?: string,
  expectedLastName?: string,
  onProgress?: (progress: number) => void
): Promise<IDScanResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Try with preprocessed image first for better OCR
    let processedImage: string;
    try {
      processedImage = await preprocessImage(imageFile);
    } catch {
      processedImage = typeof imageFile === "string" ? imageFile : URL.createObjectURL(imageFile);
    }
    
    // Perform OCR with Tesseract on preprocessed image
    const result = await Tesseract.recognize(
      processedImage,
      "eng",
      {
        logger: (m) => {
          if (m.status === "recognizing text" && onProgress) {
            onProgress(Math.round(m.progress * 100));
          }
        },
      }
    );

    let text = result.data.text;
    let confidence = result.data.confidence;
    
    // If confidence is low, try with original image
    if (confidence < 50 && typeof imageFile !== "string") {
      console.log("Low confidence, trying original image...");
      const originalResult = await Tesseract.recognize(
        imageFile,
        "eng",
        {
          logger: (m) => {
            if (m.status === "recognizing text" && onProgress) {
              onProgress(Math.round(m.progress * 100));
            }
          },
        }
      );
      
      if (originalResult.data.confidence > confidence) {
        text = originalResult.data.text;
        confidence = originalResult.data.confidence;
        console.log("Using original image result (better confidence)");
      }
    }
    
    // Split into lines for structured extraction
    const lines = text
      .split("\n")
      .map(l => l.trim())
      .filter(l => l.length > 0);
    
    console.log("=== Kenyan ID OCR Result ===");
    console.log("Full Text:", text);
    console.log("Confidence:", confidence);
    console.log("Lines:", lines);

    // Extract all fields using Kenyan ID structure
    const idNumber = extractIDNumber(text, lines);
    const serialNumber = extractSerialNumber(text, lines);
    const { fullNames, firstName, middleName, lastName } = extractFullNames(text, lines);
    const dateOfBirth = extractDateOfBirth(text, lines);
    const dateOfIssue = extractDateOfIssue(text, lines);
    const sex = extractSex(text, lines);
    const districtOfBirth = extractDistrictOfBirth(text, lines);
    const placeOfIssue = extractPlaceOfIssue(text, lines);

    console.log("=== Extracted Data ===");
    console.log("ID Number:", idNumber);
    console.log("Serial Number:", serialNumber);
    console.log("Full Names:", fullNames);
    console.log("First Name:", firstName);
    console.log("Middle Name:", middleName);
    console.log("Last Name:", lastName);
    console.log("Date of Birth:", dateOfBirth);
    console.log("Sex:", sex);
    console.log("District of Birth:", districtOfBirth);
    console.log("Place of Issue:", placeOfIssue);
    console.log("Date of Issue:", dateOfIssue);

    // Validate required fields - be more lenient
    // ID Number is the most critical
    if (!idNumber) {
      errors.push("Could not detect ID number. Please ensure the ID number (next to 'ID NUMBER:') is clearly visible.");
    }

    // Date of birth is important but can be a warning
    if (!dateOfBirth) {
      warnings.push("Could not detect date of birth. You may need to enter it manually.");
    }

    // Name is important but can be a warning if we have partial data
    if (!fullNames && !firstName && !lastName) {
      warnings.push("Could not detect name fields. You may need to verify manually.");
    }

    // Validate names match if expected names provided (as warnings, not errors)
    if (expectedFirstName && firstName) {
      const normalizedExpected = expectedFirstName.toUpperCase().trim();
      const normalizedFound = firstName.toUpperCase().trim();
      if (!normalizedFound.includes(normalizedExpected) && 
          !normalizedExpected.includes(normalizedFound) &&
          !fullNames?.toUpperCase().includes(normalizedExpected)) {
        warnings.push(`First name on ID (${firstName}) may not match your account name (${expectedFirstName}).`);
      }
    }

    if (expectedLastName && lastName) {
      const normalizedExpected = expectedLastName.toUpperCase().trim();
      const normalizedFound = lastName.toUpperCase().trim();
      if (!normalizedFound.includes(normalizedExpected) && 
          !normalizedExpected.includes(normalizedFound) &&
          !fullNames?.toUpperCase().includes(normalizedExpected)) {
        warnings.push(`Last name on ID (${lastName}) may not match your account name (${expectedLastName}).`);
      }
    }

    // Warn if confidence is low (not error)
    if (confidence < 50) {
      warnings.push("Image quality is low. Consider retaking the photo in better lighting.");
    }

    // Success criteria: only need ID number to be detected
    // Other fields are helpful but not strictly required
    const isSuccess = idNumber !== null;

    return {
      success: isSuccess,
      idNumber,
      serialNumber,
      fullNames,
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      sex,
      districtOfBirth,
      placeOfIssue,
      dateOfIssue,
      fullText: text,
      errors,
      warnings,
      confidence,
    };
  } catch (error) {
    console.error("OCR Error:", error);
    return {
      success: false,
      idNumber: null,
      serialNumber: null,
      fullNames: null,
      firstName: null,
      middleName: null,
      lastName: null,
      dateOfBirth: null,
      sex: null,
      districtOfBirth: null,
      placeOfIssue: null,
      dateOfIssue: null,
      fullText: "",
      errors: ["Failed to scan ID card. Please try again with a clearer image."],
      warnings: [],
      confidence: 0,
    };
  }
}

/**
 * Validate extracted ID scan result
 */
export function validateIDScanResult(result: IDScanResult): { valid: boolean; message: string; warnings?: string[] } {
  // Consider valid if we have at least the ID number
  if (result.idNumber) {
    const warningMessages = result.warnings || [];
    if (!result.dateOfBirth) warningMessages.push("Date of birth not detected");
    if (!result.fullNames && !result.firstName) warningMessages.push("Name not detected");
    
    return {
      valid: true,
      message: "Kenyan ID card scanned successfully!",
      warnings: warningMessages.length > 0 ? warningMessages : undefined,
    };
  }
  
  if (!result.success) {
    return {
      valid: false,
      message: result.errors.join(" "),
    };
  }

  // If we got here but don't have ID number, it's invalid
  if (!result.idNumber) {
    return {
      valid: false,
      message: "Could not detect ID number. Please upload a clearer image of your Kenyan ID.",
    };
  }

  // Build warning message for missing optional fields
  const missingOptional: string[] = [];
  if (!result.dateOfBirth) missingOptional.push("date of birth");
  if (!result.fullNames && !result.firstName) missingOptional.push("name");

  return {
    valid: true,
    message: missingOptional.length > 0 
      ? `ID scanned! Note: Could not detect ${missingOptional.join(", ")} - you may need to enter manually.`
      : "Kenyan ID card scanned successfully!",
    warnings: missingOptional.length > 0 ? [`Missing: ${missingOptional.join(", ")}`] : undefined,
  };
}

/**
 * Validate that user-entered details match the scanned ID
 */
export function validateUserDetails(
  scanResult: IDScanResult,
  enteredIdNumber: string,
  enteredName: string,
  enteredDateOfBirth: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate ID number
  if (scanResult.idNumber) {
    const scannedId = scanResult.idNumber.replace(/\s/g, "");
    const enteredId = enteredIdNumber.replace(/\s/g, "");
    if (scannedId !== enteredId) {
      errors.push(`ID number mismatch: You entered ${enteredIdNumber} but the ID shows ${scanResult.idNumber}`);
    }
  }
  
  // Validate name (check if entered name appears in scanned names)
  if (scanResult.fullNames && enteredName) {
    const scannedUpper = scanResult.fullNames.toUpperCase();
    const enteredParts = enteredName.toUpperCase().split(/\s+/);
    const matchCount = enteredParts.filter(part => scannedUpper.includes(part)).length;
    
    // At least one name part should match
    if (matchCount === 0) {
      errors.push(`Name mismatch: "${enteredName}" does not match "${scanResult.fullNames}" on the ID`);
    }
  }
  
  // Validate date of birth
  if (scanResult.dateOfBirth && enteredDateOfBirth) {
    // Normalize dates for comparison (both should be YYYY-MM-DD)
    const scannedDate = scanResult.dateOfBirth;
    const enteredDate = enteredDateOfBirth;
    
    if (scannedDate !== enteredDate) {
      errors.push(`Date of birth mismatch: You entered ${enteredDateOfBirth} but the ID shows ${scanResult.dateOfBirth}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
