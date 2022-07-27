/*
 * Provides formatting functions to convert various values to strings
 */

import { Bit, DisplayType, isUnknownBit } from "src/types";

// Convert an integer to a hex string
export const hex = (value: number) => {
  return "0x" + value.toString(16);
};

export const getStringRepresentation = (
  value: number | bigint,
  displayType: DisplayType,
  padding: number
) => {
  if (padding == 1) {
    return value.toString();
  }

  if (displayType == "hexadecimal") {
    const ret = value.toString(16).toUpperCase();
    return "0x" + "0".repeat(padding / 4 - ret.length) + ret;
  } else if (displayType == "binary") {
    const ret = value.toString(2);
    return "0b" + "0".repeat(padding - ret.length) + ret;
  } else if (displayType == "decimal") {
    return value.toString();
  } else {
    throw new Error(`Invalid display type specified: ${displayType}`);
  }
};

// Assumes a bitArray with length % 4 == 0
export const bitArrayToString = (arr: Bit[], displayType: DisplayType) => {
  // Use slice to prevent calls to .reverse() from affecting the original array
  const bitArray = arr.slice();

  if (bitArray.length == 1) {
    return bitArray.toString();
  }

  // Hexadecimal case
  if (displayType == "hexadecimal") {
    let res = "";

    // Loop by groups of 4 because 1 hex digit is 4 bits
    for (let i = 0; i < bitArray.length; i += 4) {
      const bitString = bitArray
        .slice(i, i + 4)
        .reverse()
        .join("");

      let unknownBit;
      for (const char of bitString) {
        if (isUnknownBit(char)) {
          unknownBit = char;
          break;
        }
      }

      // If any Bit is unknown, then output is unknown
      if (unknownBit) {
        res = unknownBit + res;
      } else {
        // Otherwise convert the bitString to hexadecimal
        const ret = parseInt(bitString, 2).toString(16).toUpperCase();
        res = ret + res;
      }
    }
    return "0x" + res;
  }

  // Binary case
  else if (displayType == "binary") {
    return "0b" + bitArray.reverse().join("");
  }

  // Decimal case
  else if (displayType == "decimal") {
    // If any Bit is unknown then the entire value is unknown
    for (const bit of bitArray) {
      if (isUnknownBit(bit)) {
        return bit;
      }
    }
    return parseInt(bitArray.reverse().join(""), 2).toString();
  }

  // Unsupported type case
  else {
    throw new Error(`Invalid display type specified: ${displayType}`);
  }
};

if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;

  // Test the hex() function
  // This function returns lowercase hex numbers
  it("hex()", () => {
    expect(hex(0)).toBe("0x0");
    expect(hex(16)).toBe("0x10");
    expect(hex(305441741)).toBe("0x1234abcd");
  });

  // Test the getStringRepresentation() function
  // This function turns a numeric value into a string
  it("getStringRepresentation", () => {
    expect(getStringRepresentation(0, "hexadecimal", 1)).toBe("0");
    expect(getStringRepresentation(0, "binary", 1)).toBe("0");
    expect(getStringRepresentation(0, "decimal", 1)).toBe("0");

    expect(getStringRepresentation(43981, "hexadecimal", 32)).toBe(
      "0x0000ABCD"
    );
    expect(getStringRepresentation(15, "binary", 8)).toBe("0b00001111");
  });
}
