/** Mensajes del API. El frontend reconoce "Duplicate identifier": no cambiar ese texto. */
export const MESSAGE_ERROR = {
  DuplicateIdentifier: "Duplicate identifier found in the database",
  NotFound: "Not product found with that identifier",
  InvalidBody: "Invalid body, check 'errors' property for more info.",
} as const;

export const MESSAGE_SUCCESS = {
  Added: "Product added successfully",
  Updated: "Product updated successfully",
  Removed: "Product removed successfully",
} as const;
