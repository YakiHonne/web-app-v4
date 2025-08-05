import axios from "axios";

const axiosInstance = axios.create();

axiosInstance.defaults.headers["yakihonne-api-key"] =
  import.meta.env.VITE__API_KEY;
export default axiosInstance;
