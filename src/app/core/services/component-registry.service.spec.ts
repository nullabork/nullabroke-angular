import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { ComponentRegistryService } from './component-registry.service';

describe('ComponentRegistryService', () => {
  let service: ComponentRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComponentRegistryService);
  });

  describe('default registrations', () => {
    it('should have StringInput registered', () => {
      expect(service.isRegistered('StringInput')).toBe(true);
    });

    it('should have NumberInput registered', () => {
      expect(service.isRegistered('NumberInput')).toBe(true);
    });

    it('should have FormTypes registered', () => {
      expect(service.isRegistered('FormTypes')).toBe(true);
    });

    it('should have Tags registered', () => {
      expect(service.isRegistered('Tags')).toBe(true);
    });

    it('should not have unregistered types', () => {
      expect(service.isRegistered('Unknown')).toBe(false);
    });

    it('should return all registered types', () => {
      const types = service.getAllTypes();
      expect(types).toContain('StringInput');
      expect(types).toContain('NumberInput');
      expect(types).toContain('FormTypes');
      expect(types).toContain('Tags');
      expect(types).toHaveLength(4);
    });
  });

  describe('getConfig', () => {
    it('should return config for StringInput', () => {
      const config = service.getConfig('StringInput');
      expect(config).toBeDefined();
      expect(config!.type).toBe('StringInput');
      expect(config!.displayName).toBe('Text Input');
    });

    it('should return config for NumberInput', () => {
      const config = service.getConfig('NumberInput');
      expect(config).toBeDefined();
      expect(config!.type).toBe('NumberInput');
    });

    it('should return undefined for unknown type', () => {
      expect(service.getConfig('Unknown' as any)).toBeUndefined();
    });
  });

  describe('compileValue', () => {
    it('should compile StringInput with quotes', () => {
      expect(service.compileValue('StringInput', 'hello')).toBe("'hello'");
    });

    it('should escape single quotes in StringInput', () => {
      expect(service.compileValue('StringInput', "it's")).toBe("'it''s'");
    });

    it('should compile NumberInput as raw number', () => {
      expect(service.compileValue('NumberInput', 42)).toBe('42');
    });

    it('should compile NaN NumberInput as 0', () => {
      expect(service.compileValue('NumberInput', 'abc' as any)).toBe('0');
    });

    it('should compile FormTypes with quotes', () => {
      expect(service.compileValue('FormTypes', '10-K')).toBe("'10-K'");
    });

    it('should compile Tags array as comma-separated quoted strings', () => {
      expect(service.compileValue('Tags', ['PDF', 'Report'])).toBe("'PDF','Report'");
    });

    it('should compile empty Tags as empty string', () => {
      expect(service.compileValue('Tags', [])).toBe("''");
    });

    it('should fallback to string for unknown type', () => {
      expect(service.compileValue('Unknown' as any, 'val')).toBe("'val'");
    });
  });

  describe('getDefaultValue', () => {
    it('should return empty string for StringInput', () => {
      expect(service.getDefaultValue('StringInput')).toBe('');
    });

    it('should return 0 for NumberInput', () => {
      expect(service.getDefaultValue('NumberInput')).toBe(0);
    });

    it('should return empty string for FormTypes', () => {
      expect(service.getDefaultValue('FormTypes')).toBe('');
    });

    it('should return empty array for Tags', () => {
      expect(service.getDefaultValue('Tags')).toEqual([]);
    });

    it('should return empty string for unknown type', () => {
      expect(service.getDefaultValue('Unknown' as any)).toBe('');
    });
  });

  describe('validate', () => {
    it('should return null for valid NumberInput', () => {
      expect(service.validate('NumberInput', 42)).toBeNull();
    });

    it('should return error for non-numeric NumberInput', () => {
      expect(service.validate('NumberInput', 'abc')).toContain('number');
    });

    it('should return null for types without validation', () => {
      expect(service.validate('StringInput', 'anything')).toBeNull();
    });

    it('should return null for unregistered types', () => {
      expect(service.validate('Unknown' as any, 'val')).toBeNull();
    });
  });

  describe('register', () => {
    it('should allow registering a custom component type', () => {
      service.register({
        type: 'StringInput',
        displayName: 'Custom Input',
        compile: (v) => `custom(${v})`,
        getDefaultValue: () => 'default',
      });

      const config = service.getConfig('StringInput');
      expect(config!.displayName).toBe('Custom Input');
      expect(service.compileValue('StringInput', 'x')).toBe('custom(x)');
    });
  });
});
