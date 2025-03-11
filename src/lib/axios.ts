import axios from "axios";

const endpoint = process.env.NEXT_PUBLIC_API_URL;

export const axiosInstance = axios.create({
  baseURL: endpoint,
});

export default axiosInstance;