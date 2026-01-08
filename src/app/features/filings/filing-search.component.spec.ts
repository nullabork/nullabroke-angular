import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilingSearchComponent } from './filing-search.component';
import { FilingService } from '../../core/services/filing.service';
import { SavedQueriesService } from '../../core/services/saved-queries.service';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReactiveFormsModule } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import { lucideSearch } from '@ng-icons/lucide';
import { DatePipe } from '@angular/common';
import { Filing } from '../../core/models/filing.model';

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
      isDirty: signal(false),
      newQuery: vi.fn(),
      duplicate: vi.fn(),
      save: vi.fn(),
      selectQuery: vi.fn(),
      setQueryText: vi.fn(),
    };

    mockRouter = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [FilingSearchComponent, ReactiveFormsModule],
      providers: [
        { provide: FilingService, useValue: mockFilingService },
        { provide: SavedQueriesService, useValue: mockSavedQueriesService },
        { provide: Router, useValue: mockRouter },
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

    it('should initialize query control with default query', () => {
      // The default query from component code
      const defaultQuery = "form_type = '8-K' order by snowflake desc limit 50";
      expect(component.queryControl.value).toBe(defaultQuery);
      expect(mockSavedQueriesService.setQueryText).toHaveBeenCalledWith(defaultQuery);
    });

    it('should call setQueryText on control value change', () => {
      component.queryControl.setValue('new query');
      expect(mockSavedQueriesService.setQueryText).toHaveBeenCalledWith('new query');
    });

    it('should search when search() is called', () => {
      component.queryControl.setValue('search term');
      component.search();
      
      expect(component.loading()).toBe(true);
      expect(mockFilingService.search).toHaveBeenCalledWith('search term');
      expect(component.results()).toEqual([]);
      expect(component.loading()).toBe(false);
    });

    it('should handle search errors', () => {
      const errorMsg = 'Search failed';
      mockFilingService.search.mockReturnValue(throwError(() => new Error(errorMsg)));
      
      component.queryControl.setValue('fail term');
      component.search();
      
      expect(component.error()).toBe(errorMsg);
      expect(component.loading()).toBe(false);
    });

    it('should navigate on openDocument', () => {
      const mockFiling = { accessionNumber: '0001' } as Filing;
      component.openDocument(mockFiling);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/document', '0001']);
    });

    it('should call service methods for query actions', () => {
      component.newQuery();
      expect(mockSavedQueriesService.newQuery).toHaveBeenCalled();
      expect(component.queryControl.value).toBe('');
      
      component.duplicateQuery();
      expect(mockSavedQueriesService.duplicate).toHaveBeenCalled();
      
      component.saveQuery();
      expect(mockSavedQueriesService.save).toHaveBeenCalled();
      
      component.selectSavedQuery('guid-1');
      expect(mockSavedQueriesService.selectQuery).toHaveBeenCalledWith('guid-1');
      // note: selectSavedQuery calls selectQuery which updates the signal.
      // In a real app, the signal update would trigger the component to update,
      // but since we mocked the service methods to do nothing (except return void),
      // we need to simulate the signal update if we want to test the reaction, 
      // but the component logic for updating control from signal is actually:
      // "let's just use the service selectQuery method to update the control directly... 
      //  For now, let's watch the signal."
      // The component DOES NOT seem to have an effect() listening to currentQuery signal to update control
      // except in constructor?
      // Wait, line 86-90 subscribes to control to update service.
      // But how does service update control?
      // Lines 98-105 comments say "refactored to use effect if possible" but there is NO effect code visible in the file provided.
      // Ah, line 183: this.queryControl.setValue(this.savedQueriesService.currentQuery());
      // So selectSavedQuery updates the control manually.
      expect(component.queryControl.value).toBe(''); // Mock signal still returns ''
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

