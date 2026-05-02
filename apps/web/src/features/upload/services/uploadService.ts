export async function uploadModel(file: File): Promise<unknown> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:3001/v1/cad-models/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || 'Upload failed');
  }

  return response.json();
}
