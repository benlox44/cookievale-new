import { Global, Module } from "@nestjs/common";

import { loadConfig } from "../config/env";
import { MEDIA_CONFIG } from "./media-config";
import { MediaStorageService } from "./media-storage.service";

@Global()
@Module({
  providers: [
    {
      provide: MEDIA_CONFIG,
      useFactory: () => {
        const config = loadConfig();
        return { mediaRoot: config.containerMediaPath };
      },
    },
    MediaStorageService,
  ],
  exports: [MediaStorageService],
})
export class MediaModule {}
