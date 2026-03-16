import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { Title, Meta } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let titleService: Title;
  let metaService: Meta;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent, RouterModule.forRoot([])],
      providers: [
        { provide: AuthService, useValue: { isLoading$: of(false), isAuthenticated$: of(false) } },
      ],
    }).compileComponents();

    titleService = TestBed.inject(Title);
    metaService = TestBed.inject(Meta);
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set page title on init', () => {
    expect(titleService.getTitle()).toBe('Nullabroke - Search SEC Filings Like a Pro');
  });

  it('should set meta description on init', () => {
    const descTag = metaService.getTag('name="description"');
    expect(descTag).toBeTruthy();
    expect(descTag?.content).toContain('Search, explore, and analyze SEC filings');
  });

  it('should render the hero heading', () => {
    const el: HTMLElement = fixture.nativeElement;
    const h1 = el.querySelector('h1');
    expect(h1).toBeTruthy();
    expect(h1?.textContent).toContain('Search and analyze');
    expect(h1?.textContent).toContain('precision');
  });

  it('should render hero floating mockups', () => {
    const el: HTMLElement = fixture.nativeElement;
    const mockups = el.querySelector('.hero-mockups');
    expect(mockups).toBeTruthy();
    const mockupResults = el.querySelector('.mockup-results');
    expect(mockupResults).toBeTruthy();
    const mockupQueries = el.querySelector('.mockup-queries');
    expect(mockupQueries).toBeTruthy();
  });

  it('should render the scrolling marquee with 8 items', () => {
    const el: HTMLElement = fixture.nativeElement;
    const marqueeSection = el.querySelector('section[aria-label="Feature highlights marquee"]');
    expect(marqueeSection).toBeTruthy();
    const items = el.querySelectorAll('.marquee-content:first-child .marquee-item');
    expect(items.length).toBe(8);
  });

  it('should render all eight feature cards', () => {
    const el: HTMLElement = fixture.nativeElement;
    const cards = el.querySelectorAll('.feature-card');
    expect(cards.length).toBe(8);
    const h3s = el.querySelectorAll('.feature-card h3');
    expect(h3s[0].textContent).toContain('Query Builder');
    expect(h3s[1].textContent).toContain('Blueprint Queries');
    expect(h3s[2].textContent).toContain('Save & Organize');
    expect(h3s[3].textContent).toContain('Document Viewer');
    expect(h3s[4].textContent).toContain('XBRL Data Viewer');
    expect(h3s[5].textContent).toContain('Works on Any Device');
    expect(h3s[6].textContent).toContain('Dynamic Parameters');
    expect(h3s[7].textContent).toContain('Real-Time EDGAR Data');
  });

  it('should use circular icon styling on feature cards', () => {
    const el: HTMLElement = fixture.nativeElement;
    const icons = el.querySelectorAll('.feature-icon-circle');
    expect(icons.length).toBe(8);
  });

  it('should render showcase screenshots with alt text and lazy loading', () => {
    const el: HTMLElement = fixture.nativeElement;
    const showcaseImgs = el.querySelectorAll('.showcase-img') as NodeListOf<HTMLImageElement>;
    expect(showcaseImgs.length).toBe(4);
    showcaseImgs.forEach(img => {
      expect(img.alt).toBeTruthy();
      expect(img.alt.length).toBeGreaterThan(10);
      expect(img.getAttribute('loading')).toBe('lazy');
    });
  });

  it('should have sign-in links pointing to /auth', () => {
    const el: HTMLElement = fixture.nativeElement;
    const links = el.querySelectorAll('a[href="/auth"]');
    expect(links.length).toBeGreaterThanOrEqual(2);
  });

  it('should use semantic HTML elements', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('header')).toBeTruthy();
    expect(el.querySelector('main')).toBeTruthy();
    expect(el.querySelector('footer')).toBeTruthy();
    expect(el.querySelector('nav')).toBeTruthy();
    expect(el.querySelectorAll('article').length).toBe(8);
  });

  it('should have aria labels on navigation and sections', () => {
    const el: HTMLElement = fixture.nativeElement;
    const nav = el.querySelector('nav');
    expect(nav?.getAttribute('aria-label')).toBe('Main navigation');
    const sections = el.querySelectorAll('section[aria-label]');
    expect(sections.length).toBeGreaterThanOrEqual(2);
  });

  it('should have aria-hidden on decorative elements', () => {
    const el: HTMLElement = fixture.nativeElement;
    const heroBg = el.querySelector('.hero-bg');
    expect(heroBg?.getAttribute('aria-hidden')).toBe('true');
    const ctaGlow = el.querySelector('.cta-glow');
    expect(ctaGlow?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should render the teal-tinted CTA section', () => {
    const el: HTMLElement = fixture.nativeElement;
    const ctaCard = el.querySelector('.cta-card-v2');
    expect(ctaCard).toBeTruthy();
    const ctaHeading = el.querySelectorAll('h2');
    const ctaTexts = Array.from(ctaHeading).map(h => h.textContent);
    expect(ctaTexts.some(t => t?.includes('Ready to explore'))).toBe(true);
  });

  it('should render 4-column footer with quick links and support', () => {
    const el: HTMLElement = fixture.nativeElement;
    const footer = el.querySelector('footer');
    expect(footer).toBeTruthy();
    const footerLinks = footer!.querySelectorAll('a');
    const hrefs = Array.from(footerLinks).map(a => a.getAttribute('href') || a.getAttribute('ng-reflect-router-link'));
    expect(hrefs.some(h => h?.includes('help'))).toBe(true);
    expect(hrefs.some(h => h?.includes('issues'))).toBe(true);
    expect(footer?.textContent).toContain('Powered by EDGAR');
    const h4s = footer!.querySelectorAll('h4');
    expect(h4s.length).toBe(3);
  });

  it('should render the stats section with teal numbers', () => {
    const el: HTMLElement = fixture.nativeElement;
    const statsSection = el.querySelector('section[aria-label="Platform highlights"]');
    expect(statsSection).toBeTruthy();
    expect(statsSection?.textContent).toContain('19+');
    expect(statsSection?.textContent).toContain('100%');
    expect(statsSection?.textContent).toContain('EDGAR');
  });

  it('should have How It Works nav link', () => {
    const el: HTMLElement = fixture.nativeElement;
    const howLink = el.querySelector('a[href="#how-it-works"]');
    expect(howLink).toBeTruthy();
    expect(howLink?.textContent).toContain('How It Works');
  });
});
