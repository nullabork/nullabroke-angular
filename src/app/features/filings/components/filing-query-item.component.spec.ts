import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilingQueryItemComponent } from './filing-query-item.component';
import { describe, it, expect, vi } from 'vitest';
import { SavedQuery } from '../../../core/models/query-parameter.model';

describe('FilingQueryItemComponent', () => {
  let component: FilingQueryItemComponent;
  let fixture: ComponentFixture<FilingQueryItemComponent>;

  const mockQuery: SavedQuery = {
    query: "form_type = '10-K'",
    values: [],
    name: 'Annual Reports',
    pinned: false,
    lastUsed: '2024-01-15T10:00:00Z',
  };

  const setupTest = async (opts: {
    query?: SavedQuery;
    isActive?: boolean;
    isRenaming?: boolean;
    renameValue?: string;
    isBlueprint?: boolean;
  } = {}) => {
    await TestBed.configureTestingModule({
      imports: [FilingQueryItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FilingQueryItemComponent);
    fixture.componentRef.setInput('guid', 'test-guid-1');
    fixture.componentRef.setInput('query', opts.query ?? mockQuery);
    fixture.componentRef.setInput('isActive', opts.isActive ?? false);
    fixture.componentRef.setInput('isRenaming', opts.isRenaming ?? false);
    fixture.componentRef.setInput('renameValue', opts.renameValue ?? '');
    fixture.componentRef.setInput('color', '#ff5500');
    fixture.componentRef.setInput('iconText', '10-K');
    fixture.componentRef.setInput('displayText', 'Annual Reports');
    fixture.componentRef.setInput('relativeTime', '2h ago');
    fixture.componentRef.setInput('isBlueprint', opts.isBlueprint ?? false);
    fixture.detectChanges();
    component = fixture.componentInstance;
  };

  it('should create', async () => {
    await setupTest();
    expect(component).toBeTruthy();
  });

  it('should have the filing-query-item host class', async () => {
    await setupTest();
    expect(fixture.nativeElement.classList.contains('filing-query-item')).toBe(true);
  });

  it('should render display text', async () => {
    await setupTest();
    expect(fixture.nativeElement.textContent).toContain('Annual Reports');
  });

  it('should render icon text', async () => {
    await setupTest();
    expect(fixture.nativeElement.textContent).toContain('10-K');
  });

  it('should show pin icon when query is pinned', async () => {
    await setupTest({ query: { ...mockQuery, pinned: true } });
    const pinIcon = fixture.nativeElement.querySelector('ng-icon[name="lucidePin"]');
    expect(pinIcon).toBeTruthy();
  });

  it('should not show pin icon when query is not pinned', async () => {
    await setupTest({ query: { ...mockQuery, pinned: false } });
    const pinIcon = fixture.nativeElement.querySelector('ng-icon[name="lucidePin"]');
    expect(pinIcon).toBeNull();
  });

  it('should show rename input when isRenaming is true', async () => {
    await setupTest({ isRenaming: true, renameValue: 'New Name' });
    const input = fixture.nativeElement.querySelector('input');
    expect(input).toBeTruthy();
    expect(input.value).toBe('New Name');
  });

  it('should show link when not renaming', async () => {
    await setupTest({ isRenaming: false });
    const link = fixture.nativeElement.querySelector('a');
    expect(link).toBeTruthy();
  });

  it('should emit select when clicked', async () => {
    await setupTest();
    const spy = vi.fn();
    component.select.subscribe(spy);

    const link = fixture.nativeElement.querySelector('a');
    link.click();

    expect(spy).toHaveBeenCalledWith('test-guid-1');
  });

  it('should emit saveRename on checkmark click', async () => {
    await setupTest({ isRenaming: true });
    const spy = vi.fn();
    component.saveRename.subscribe(spy);

    const saveBtn = fixture.nativeElement.querySelector('button[title="Save"]');
    saveBtn.click();

    expect(spy).toHaveBeenCalled();
  });

  it('should show relative time', async () => {
    await setupTest();
    expect(fixture.nativeElement.textContent).toContain('2h ago');
  });
});
