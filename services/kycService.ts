import axios from "axios";

const BASE_URL = "https://swiftpaymfb.com/api";

export const submitKycStep1 = async (
  frontImage: any,
  backImage: any,
  token: string,
  document_type:string,
  document_number:string
) => {
  const formData = new FormData();

  // Create proper file objects from local URIs
  formData.append("document_front_upload", {
    uri: frontImage.uri,
    name: frontImage.uri.split('/')[frontImage.uri.split('/').length - 1],
    type: "image" + '/' + frontImage.uri.split('.')[frontImage.uri.split('.').length - 1]
  } as any);

  formData.append("document_back_upload", {
    uri: backImage.uri,
    name: backImage.uri.split('/')[backImage.uri.split('/').length - 1],
    type: "image" + '/' + backImage.uri.split('.')[backImage.uri.split('.').length - 1]
  } as any);

  formData.append("document_type", document_type)
  formData.append("document_number", document_number)

  try {
    const response = await axios({
      method: "post",
      url: `${BASE_URL}/kyc/submit-step-2`,
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
      data: formData,
    });

    return response.data;
  } catch (error) {
    console.log(error);
    
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message || "Failed to submit KYC step 1"
      );
    }
    throw error;
  }
};

export const submitKycStep2 = async (
  data: {
    first_name: string;
    last_name: string;
    other_names?: string;
    document_number: string;
    date_of_birth: string;
    address: string;
  },
  token: string
) => {
  const response = await axios({
    method: "post",
    url: `${BASE_URL}/submit-step2`,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: JSON.stringify(data),
  });

  if (response.status !== 200 && response.status !== 201) {
    throw new Error("Failed to submit KYC step 2");
  }

  return response.data;
};

export const submitKycStep3 = async (
  data: {
    face_cam_photo: string;
    occupation: string;
    gender: string;
    profit: string;
  },
  token: string
) => {
  const response = await axios({
    method: "post",
    url: `${BASE_URL}/submit-step3`,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: JSON.stringify(data),
  });

  if (response.status !== 200 && response.status !== 201) {
    throw new Error("Failed to submit KYC step 3");
  }

  return response.data;
};

export const submitKycDetails1 = async (
  data: {
    first_name: string;
    last_name: string;
    other_names?: string;
    occupation: string;
    date_of_birth: string;
    address: string;
    gender: string;
  },
  token: string
) => {
  const response = await axios({
    method: "post",
    url: `${BASE_URL}/kyc/submit-step-1`,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: JSON.stringify(data),
  });

  if (response.status !== 200 && response.status !== 201) {
    throw new Error("Failed to submit KYC step 2");
  }

  return response.data;
};

export const submitKycLiveness = async (
  face_image:string,
  token:string
) => {
  const formData = new FormData();

  // Create proper file objects from local URIs
  formData.append("face_image", {
    uri: face_image,
    name: face_image.split('/')[face_image.split('/').length - 1],
    type: "image" + '/' + face_image.split('.')[face_image.split('.').length - 1]
  } as any);


  try {
    const response = await axios({
      method: "post",
      url: `${BASE_URL}/kyc/submit-step-3`,
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
      data: formData,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message || "Failed to submit KYC step 1"
      );
    }
    throw error;
  }
};