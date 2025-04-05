import path from "path";
import {
  LocalIndex,
  MetadataFilter,
  type IndexItem,
  type MetadataTypes,
  type QueryResult,
} from "vectra";
import { Mutex } from "async-mutex";

import * as fs from "fs/promises";
import type { DbItem } from "../types/types";
import { initWorkers } from "../workers/workermanager";

const indexDir = path.join(__dirname, "vectra_index");
const mutex = new Mutex();

class VectraIndex {
  private instance;
  constructor() {
    this.instance = new LocalIndex(indexDir);
  }

  async init(): Promise<void> {
    await fs.mkdir(indexDir, { recursive: true }).catch(() => {});
    if (!(await this.instance.isIndexCreated())) {
      await this.instance.createIndex();
    }
  }

  async prepareFilesForIndexing(files: string[]): Promise<DbItem[]> {
    if (!(await this.instance.isIndexCreated())) {
      console.error("Index does not exist");
      return [];
    }
    await initWorkers(files, true);
    return [];
  }

  async addFiles(chunks: DbItem[]): Promise<void> {
    mutex.acquire().then(async (release: () => void) => {
      for (const chunk of chunks) {
        try {
          await this.instance.insertItem({
            vector: chunk.embedding,
            metadata: {
              projectId: chunk.projectId,
              path: chunk.path.toLowerCase(),
              content: chunk.content,
            },
          });
        } catch (e) {
          console.error(e);
        }
      }
      release();
    });
  }

  async deleteIndex(): Promise<void> {
    await this.instance.deleteIndex();
  }

  async listItems(): Promise<IndexItem<Record<string, MetadataTypes>>[]> {
    if (await this.instance.isIndexCreated()) {
      return await this.instance.listItems();
    } else {
      return [];
    }
  }

  async queryItems(
    embedding: number[],
    k: number,
    filter?: MetadataFilter
  ): Promise<QueryResult<Record<string, MetadataTypes>>[]> {
    return await this.instance.queryItems(embedding, k, filter);
  }

  async deleteItemByPath(path: string): Promise<void> {
    if (!(await this.instance.isIndexCreated())) {
      console.error("Index does not exist");
      return;
    }

    const results = await this.instance.listItemsByMetadata({
      path: { $eq: path.toLowerCase() },
    });

    if (results.length === 0) {
      console.error("No items found with path:", path);
      return;
    }

    await this.instance.beginUpdate();
    await Promise.all(results.map((item) => this.instance.deleteItem(item.id)));
    await this.instance.endUpdate();
  }

  async updateItemByPath(path: string): Promise<void> {
    await this.deleteItemByPath(path);
    await initWorkers([path], false);
  }

  //Temporary
  async getItemsByPath(
    path: string
  ): Promise<IndexItem<Record<string, MetadataTypes>>[]> {
    return await this.instance.listItemsByMetadata({
      path: { $eq: path },
    });
  }
}
const vectraIndex = new VectraIndex();
vectraIndex.init();
export default vectraIndex;
