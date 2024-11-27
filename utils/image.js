import path from 'path';

export function getFilePath(file) {
  const filePath = file.path;

  // Normaliza la ruta para usar el separador correcto del sistema
  const normalizedPath = path.normalize(filePath);

  // Reemplaza todas las barras invertidas por barras diagonales
  const finalPath = normalizedPath.replace(/\\/g, '/');

  // Obtén solo el nombre del archivo
  const fileName = finalPath.split('/').pop();

  // Determina la carpeta según el campo de subida
  const folder = file.fieldName === "avatar" ? "avatar" : "images";

  console.log("Normalized Path:", normalizedPath);  // Verifica la ruta completa del archivo
  console.log("Final Path:", finalPath);  // Verifica la ruta con barras diagonales
  console.log("File Field Name:", file.fieldName);  // Verifica el campo de subida

  return `${folder}/${fileName}`;  // Devuelve la ruta con la carpeta correcta
}
