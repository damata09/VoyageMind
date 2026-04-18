import { getApiBaseUrl } from './api';

export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const token = localStorage.getItem("voyagemind_token");
  if (!token) throw new Error("Não autenticado");
  
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await fetch(`${getApiBaseUrl()}/auth/avatar`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Erro ao fazer upload da imagem");
  }

  return response.json();
}
