import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilingSearchComponent } from './filing-search.component';
import { FilingService } from '../../core/services/filing.service';
import { SavedQueriesService } from '../../core/services/saved-queries.service';
import { ActivatedRoute, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReactiveFormsModule } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import { lucideSearch } from '@ng-icons/lucide';

describe('FilingSearchComponent', () => {
  let component: FilingSearchComponent;
  let fixture: ComponentFixture<FilingSearchComponent>;
  let mockFilingService: { search: any };
  let mockSavedQueriesService: any;
  let mockRouter: { navigate: any };

  const setupTest = async (initialQuery = '') => {
    mockFilingService = {
      search: vi.fn().mockReturnValue(of([]))
    };

    mockSavedQueriesService = {
      savedQueries: signal({}),
      currentGuid: signal(null),
      currentQuery: signal(initialQuery),
      currentParameters: signal([]),
      currentParseErrors: signal([]),
      isCurrentQueryValid: signal(true),
      newQuery: vi.fn(),
      duplicateQuery: vi.fn(),
      selectQuery: vi.fn(),
      setQueryText: vi.fn(),
      getCompiledQuery: vi.fn().mockReturnValue(initialQuery),
      canCompile: vi.fn().mockReturnValue({ success: true, errors: [] }),
    };

    mockRouter = {
      navigate: vi.fn()
    };

    const mockActivatedRoute = {
      snapshot: {
        queryParamMap: { get: () => null },
      },
    };

    await TestBed.configureTestingModule({
      imports: [FilingSearchComponent, ReactiveFormsModule],
      providers: [
        { provide: FilingService, useValue: mockFilingService },
        { provide: SavedQueriesService, useValue: mockSavedQueriesService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        provideIcons({ lucideSearch })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FilingSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  describe('when initialized with no query', () => {
    beforeEach(() => setupTest(''));

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty query control when no current query', () => {
      expect(component.queryControl.value).toBe('');
    });

    it('should call setQueryText on control value change', () => {
      component.queryControl.setValue('new query');
      expect(mockSavedQueriesService.setQueryText).toHaveBeenCalledWith('new query');
    });

    it('should search when search() is called', () => {
      component.queryControl.setValue('search term');
      mockSavedQueriesService.getCompiledQuery.mockReturnValue('search term');
      component.search();
      
      expect(mockFilingService.search).toHaveBeenCalledWith('search term');
      expect(component.results()).toEqual([]);
      expect(component.loading()).toBe(false);
      expect(component.hasSearched()).toBe(true);
    });

    it('should handle search errors by showing no results', () => {
      mockFilingService.search.mockReturnValue(throwError(() => new Error('Server error')));
      mockSavedQueriesService.getCompiledQuery.mockReturnValue('fail term');
      
      component.queryControl.setValue('fail term');
      component.search();
      
      expect(component.error()).toBeNull();
      expect(component.results()).toEqual([]);
      expect(component.loading()).toBe(false);
    });

    it('should call service methods for query actions', () => {
      component.newQuery();
      expect(mockSavedQueriesService.newQuery).toHaveBeenCalled();
      expect(component.queryControl.value).toBe('');
      
      component.selectSavedQuery('guid-1');
      expect(mockSavedQueriesService.selectQuery).toHaveBeenCalledWith('guid-1');
    });

    it('should toggle query expansion', () => {
      const initial = component.queryExpanded();
      component.toggleQuery();
      expect(component.queryExpanded()).toBe(!initial);
    });
  });

  describe('when initialized with existing query', () => {
    beforeEach(() => setupTest('existing query'));

    it('should initialize query control with existing query', () => {
      expect(component.queryControl.value).toBe('existing query');
      // Should NOT set default query
      expect(mockSavedQueriesService.setQueryText).not.toHaveBeenCalledWith(expect.stringContaining('form_type'));
    });
  });
});

