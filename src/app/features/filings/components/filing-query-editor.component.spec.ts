import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { FilingQueryEditorComponent } from './filing-query-editor.component';
import { describe, it, expect, vi } from 'vitest';

describe('FilingQueryEditorComponent', () => {
  let component: FilingQueryEditorComponent;
  let fixture: ComponentFixture<FilingQueryEditorComponent>;

  const setupTest = async (opts: {
    query?: string;
    isValid?: boolean;
    parseErrors?: { message: string; startIndex: number; endIndex: number }[];
    hasParameters?: boolean;
  } = {}) => {
    const queryControl = new FormControl<string>(opts.query ?? '', { nonNullable: true });

    await TestBed.configureTestingModule({
      imports: [FilingQueryEditorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FilingQueryEditorComponent);
    fixture.componentRef.setInput('queryControl', queryControl);
    fixture.componentRef.setInput('isQueryValid', opts.isValid ?? true);
    fixture.componentRef.setInput('parseErrors', opts.parseErrors ?? []);
    fixture.componentRef.setInput('hasParameters', opts.hasParameters ?? false);
    fixture.detectChanges();
    component = fixture.componentInstance;
  };

  it('should create', async () => {
    await setupTest();
    expect(component).toBeTruthy();
  });

  it('should have the filing-query-editor host class', async () => {
    await setupTest();
    expect(fixture.nativeElement.classList.contains('filing-query-editor')).toBe(true);
  });

  it('should render textarea with form control value', async () => {
    await setupTest({ query: 'test query' });
    const textarea = fixture.nativeElement.querySelector('textarea');
    expect(textarea.value).toBe('test query');
  });

  it('should show parse errors when present', async () => {
    await setupTest({
      parseErrors: [{ message: 'Unexpected token', startIndex: 0, endIndex: 5 }],
    });
    expect(fixture.nativeElement.textContent).toContain('Unexpected token');
  });

  it('should not show parse errors section when empty', async () => {
    await setupTest({ parseErrors: [] });
    const errorSection = fixture.nativeElement.querySelector('.bg-\\[\\#5a1d1d\\]');
    expect(errorSection).toBeNull();
  });

  it('should show parameters indicator when hasParameters is true', async () => {
    await setupTest({ hasParameters: true });
    expect(fixture.nativeElement.textContent).toContain('Query has parameters');
  });

  it('should not show parameters indicator when hasParameters is false', async () => {
    await setupTest({ hasParameters: false });
    expect(fixture.nativeElement.textContent).not.toContain('Query has parameters');
  });

  it('should emit searchTriggered on Ctrl+Enter', async () => {
    await setupTest();
    const spy = vi.fn();
    component.searchTriggered.subscribe(spy);

    const textarea = fixture.nativeElement.querySelector('textarea');
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true }));
    fixture.detectChanges();

    expect(spy).toHaveBeenCalled();
  });
});
