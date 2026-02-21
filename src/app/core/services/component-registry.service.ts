import { Injectable, Type } from '@angular/core';
import { RenderComponentConfig, RenderComponentType } from '../models/query-parameter.model';

/**
 * Configuration for the default render components.
 */
const DEFAULT_COMPONENT_CONFIGS: Record<RenderComponentType, RenderComponentConfig> = {
  StringInput: {
    type: 'StringInput',
    displayName: 'Text Input',
    compile: (value) => {
      const str = String(value ?? '');
      // Escape single quotes by doubling them
      const escaped = str.replace(/'/g, "''");
      return `'${escaped}'`;
    },
    getDefaultValue: () => '',
  },
  
  NumberInput: {
    type: 'NumberInput',
    displayName: 'Number Input',
    compile: (value) => {
      const num = typeof value === 'string' ? parseFloat(value) : Number(value);
      return isNaN(num) ? '0' : String(num);
    },
    getDefaultValue: () => 0,
    validate: (value) => {
      const num = typeof value === 'string' ? parseFloat(value as string) : value;
      if (typeof num !== 'number' || isNaN(num as number)) {
        return 'Value must be a number';
      }
      return null;
    },
  },
  
  FormTypes: {
    type: 'FormTypes',
    displayName: 'Form Type',
    compile: (value) => {
      const str = String(value ?? '');
      const escaped = str.replace(/'/g, "''");
      return `'${escaped}'`;
    },
    getDefaultValue: () => '',
  },
  
  Tags: {
    type: 'Tags',
    displayName: 'Tags',
    compile: (value) => {
      const tags = Array.isArray(value) 
        ? value 
        : (typeof value === 'string' ? value.split(',').map(t => t.trim()).filter(t => t) : []);
      
      if (tags.length === 0) {
        return "''";
      }
      
      return tags.map(tag => {
        const escaped = String(tag).replace(/'/g, "''");
        return `'${escaped}'`;
      }).join(',');
    },
    getDefaultValue: () => [] as string[],
  },
};

/**
 * Service that manages the registry of render component types.
 * Provides extensibility for adding new component types.
 */
@Injectable({
  providedIn: 'root',
})
export class ComponentRegistryService {
  private readonly registry = new Map<RenderComponentType, RenderComponentConfig>();

  constructor() {
    // Register default components
    this.registerDefaults();
  }

  /**
   * Register default component configurations.
   */
  private registerDefaults(): void {
    for (const config of Object.values(DEFAULT_COMPONENT_CONFIGS)) {
      this.registry.set(config.type, config);
    }
  }

  /**
   * Register a new component type or override existing one.
   */
  register(config: RenderComponentConfig): void {
    this.registry.set(config.type, config);
  }

  /**
   * Get configuration for a component type.
   */
  getConfig(type: RenderComponentType): RenderComponentConfig | undefined {
    return this.registry.get(type);
  }

  /**
   * Get all registered component types.
   */
  getAllTypes(): RenderComponentType[] {
    return [...this.registry.keys()];
  }

  /**
   * Check if a component type is registered.
   */
  isRegistered(type: string): boolean {
    return this.registry.has(type as RenderComponentType);
  }

  /**
   * Compile a value using the component type's compile function.
   */
  compileValue(type: RenderComponentType, value: string | number | string[]): string {
    const config = this.registry.get(type);
    if (!config) {
      // Fallback to string compilation
      const str = String(value ?? '');
      const escaped = str.replace(/'/g, "''");
      return `'${escaped}'`;
    }
    return config.compile(value);
  }

  /**
   * Get default value for a component type.
   */
  getDefaultValue(type: RenderComponentType): string | number | string[] {
    const config = this.registry.get(type);
    return config?.getDefaultValue() ?? '';
  }

  /**
   * Validate a value for a component type.
   */
  validate(type: RenderComponentType, value: unknown): string | null {
    const config = this.registry.get(type);
    if (!config?.validate) {
      return null;
    }
    return config.validate(value);
  }
}
