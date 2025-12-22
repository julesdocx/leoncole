import { SchemaTypeDefinition } from 'sanity'

import blockContent from './blockContent'
import post from './post'
import siteSettings from './siteSettings'

export const schemaTypes = [siteSettings, post, blockContent]
export const schema: { types: SchemaTypeDefinition[] } = {
  types: [siteSettings, post, blockContent],
}
 