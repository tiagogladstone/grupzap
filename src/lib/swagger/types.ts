// Tipos simplificados do OpenAPI 3.0 para uso sem dependência externa
export namespace OpenAPIV3 {
  export interface Document {
    openapi: string
    info: InfoObject
    servers?: ServerObject[]
    tags?: TagObject[]
    paths: PathsObject
    components?: ComponentsObject
  }

  export interface InfoObject {
    title: string
    description?: string
    version: string
    contact?: { name?: string; url?: string; email?: string }
  }

  export interface ServerObject {
    url: string
    description?: string
  }

  export interface TagObject {
    name: string
    description?: string
  }

  export type PathsObject = Record<string, PathItemObject>

  export interface PathItemObject {
    get?: OperationObject
    post?: OperationObject
    put?: OperationObject
    patch?: OperationObject
    delete?: OperationObject
  }

  export interface OperationObject {
    tags?: string[]
    summary?: string
    description?: string
    parameters?: ParameterObject[]
    requestBody?: RequestBodyObject
    responses: Record<string, ResponseObject>
    security?: Record<string, string[]>[]
  }

  export interface ParameterObject {
    name: string
    in: 'query' | 'path' | 'header' | 'cookie'
    required?: boolean
    schema: SchemaObject
    description?: string
  }

  export interface RequestBodyObject {
    required?: boolean
    content: Record<string, MediaTypeObject>
  }

  export interface ResponseObject {
    description: string
    content?: Record<string, MediaTypeObject>
  }

  export interface MediaTypeObject {
    schema: SchemaObject
  }

  export interface SchemaObject {
    type?: string
    format?: string
    properties?: Record<string, SchemaObject>
    items?: SchemaObject
    required?: string[]
    enum?: string[]
    $ref?: string
    nullable?: boolean
    minimum?: number
    maximum?: number
    description?: string
  }

  export interface ComponentsObject {
    schemas?: Record<string, SchemaObject>
    securitySchemes?: Record<string, SecuritySchemeObject>
  }

  export interface SecuritySchemeObject {
    type: string
    scheme?: string
    in?: string
    name?: string
    description?: string
  }
}
