import { Injectable, OnModuleInit } from '@nestjs/common';
import slugger from 'github-slugger';

@Injectable()
export class SlugService implements OnModuleInit {
  slug: slugger;
  constructor() {}

  onModuleInit() {
    this.slug = new slugger();
  }
  getInstance() {
    return this.slug;
  }
  slugify(text: string): string {
    return this.slug.slug(text);
  }
}
