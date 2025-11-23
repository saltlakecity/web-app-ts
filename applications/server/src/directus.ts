import axios from "axios";

const directusUrl = process.env.DIRECTUS_URL || "http://localhost:8055";

export const directusClient = axios.create({
  baseURL: directusUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Example function to get items from a collection
export const getItems = async (collection: string) => {
  try {
    const response = await directusClient.get(`/items/${collection}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching items from Directus:", error);
    throw error;
  }
};

// Example function to create an item
export const createItem = async (collection: string, data: any) => {
  try {
    const response = await directusClient.post(`/items/${collection}`, data);
    return response.data.data;
  } catch (error) {
    console.error("Error creating item in Directus:", error);
    throw error;
  }
};
