import { StorageService } from "./storage.service";

describe("StorageService", () => {
  it("genera path seguro y modo local-dev sin Firebase", async () => {
    const storage = new StorageService();
    storage.onModuleInit();
    expect(storage.isReady()).toBe(false);

    const path = storage.buildStoragePath("user-1", "Mi Tarea.pdf", "post");
    expect(path).toContain("post/user-1/");
    expect(path).toContain("Mi_Tarea.pdf");

    const upload = await storage.createUploadUrl(path);
    expect(upload.mode).toBe("local-dev");
    expect(upload.uploadUrl).toContain("local-dev://upload/");
  });
});
