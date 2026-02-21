import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideSearch,
  lucideCode,
  lucideHash,
  lucideType,
  lucideTag,
  lucideFileText,
  lucideBookOpen,
  lucideSidebar,
  lucideMousePointerClick,
  lucideRotateCcw,
  lucideEllipsisVertical,
  lucidePlus,
  lucideList,
} from '@ng-icons/lucide';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [RouterLink, NgIcon],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideSearch,
      lucideCode,
      lucideHash,
      lucideType,
      lucideTag,
      lucideFileText,
      lucideBookOpen,
      lucideSidebar,
      lucideMousePointerClick,
      lucideRotateCcw,
      lucideEllipsisVertical,
      lucidePlus,
      lucideList,
    }),
  ],
  template: `
    <div class="min-h-screen bg-[#1e1e1e] text-[#cccccc]">
      <!-- Top bar -->
      <header class="sticky top-0 z-20 h-9 flex items-center justify-between px-3 bg-[#252526] border-b border-[#3c3c3c]">
        <div class="flex items-center gap-2">
          <a routerLink="/" class="flex items-center justify-center w-7 h-7 text-[#858585] hover:text-[#cccccc] hover:bg-[#3c3c3c]" title="Back to search">
            <ng-icon name="lucideArrowLeft" class="text-[16px]" />
          </a>
          <span class="text-[13px] text-[#3c3c3c]">|</span>
          <span class="text-[13px]">Help & Reference</span>
        </div>
      </header>

      <div class="max-w-4xl mx-auto px-6 py-8">

        <!-- ===== CHEAT SHEET ===== -->
        <section class="mb-12">
          <h1 class="text-[22px] font-semibold text-white mb-1 flex items-center gap-2">
            <ng-icon name="lucideBookOpen" class="text-[#4ec9b0]" /> Query Cheat Sheet
          </h1>
          <p class="text-[13px] text-[#858585] mb-5">Quick reference for writing filing queries.</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <!-- Card -->
            <div class="bg-[#252526] border border-[#3c3c3c] rounded p-4">
              <div class="text-[11px] uppercase tracking-wide text-[#858585] mb-2">Basic filter</div>
              <code class="text-[13px] text-[#ce9178] font-mono">form_type = '10-K' limit 25</code>
            </div>
            <div class="bg-[#252526] border border-[#3c3c3c] rounded p-4">
              <div class="text-[11px] uppercase tracking-wide text-[#858585] mb-2">Multiple values</div>
              <code class="text-[13px] text-[#ce9178] font-mono">form_type in ('10-K','10-Q','8-K')</code>
            </div>
            <div class="bg-[#252526] border border-[#3c3c3c] rounded p-4">
              <div class="text-[11px] uppercase tracking-wide text-[#858585] mb-2">Wildcard search</div>
              <code class="text-[13px] text-[#ce9178] font-mono">company_name ilike '%Microsoft%'</code>
            </div>
            <div class="bg-[#252526] border border-[#3c3c3c] rounded p-4">
              <div class="text-[11px] uppercase tracking-wide text-[#858585] mb-2">Sort &amp; limit</div>
              <code class="text-[13px] text-[#ce9178] font-mono">order by snowflake desc limit 50</code>
            </div>
            <div class="bg-[#252526] border border-[#3c3c3c] rounded p-4">
              <div class="text-[11px] uppercase tracking-wide text-[#858585] mb-2">Tags filter</div>
              <code class="text-[13px] text-[#ce9178] font-mono">array['Presentation'] && tags</code>
            </div>
            <div class="bg-[#252526] border border-[#3c3c3c] rounded p-4">
              <div class="text-[11px] uppercase tracking-wide text-[#858585] mb-2">Subquery (by ticker)</div>
              <code class="text-[13px] text-[#ce9178] font-mono break-all">cik = (select cik from ticker where ticker ilike 'MSFT')</code>
            </div>
            <div class="bg-[#252526] border border-[#3c3c3c] rounded p-4">
              <div class="text-[11px] uppercase tracking-wide text-[#858585] mb-2">Negation</div>
              <code class="text-[13px] text-[#ce9178] font-mono">form_type not in ('3','4','5')</code>
            </div>
            <div class="bg-[#252526] border border-[#3c3c3c] rounded p-4">
              <div class="text-[11px] uppercase tracking-wide text-[#858585] mb-2">With parameter</div>
              <code class="text-[13px] text-[#ce9178] font-mono">form_type = {{ '{' }}Type:FormTypes:8-K{{ '}' }}</code>
            </div>
          </div>
        </section>

        <!-- ===== QUERY CONSTRUCTION ===== -->
        <section class="mb-12">
          <h2 class="text-[18px] font-semibold text-white mb-1 flex items-center gap-2">
            <ng-icon name="lucideSearch" class="text-[#569cd6]" /> Query Construction
          </h2>
          <p class="text-[13px] text-[#858585] mb-4">Queries are SQL-like WHERE clause fragments executed against the filings database.</p>

          <div class="space-y-4 text-[13px]">
            <div class="bg-[#252526] border border-[#3c3c3c] rounded p-4">
              <h3 class="text-[14px] text-white font-medium mb-2">Available columns</h3>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-y-1 font-mono text-[12px]">
                <span class="text-[#4ec9b0]">form_type</span>
                <span class="text-[#4ec9b0]">company_name</span>
                <span class="text-[#4ec9b0]">cik</span>
                <span class="text-[#4ec9b0]">accession_number</span>
                <span class="text-[#4ec9b0]">date_filed</span>
                <span class="text-[#4ec9b0]">date_published</span>
                <span class="text-[#4ec9b0]">snowflake</span>
                <span class="text-[#4ec9b0]">tags</span>
                <span class="text-[#4ec9b0]">description</span>
                <span class="text-[#4ec9b0]">relationship</span>
                <span class="text-[#4ec9b0]">central_index_key</span>
                <span class="text-[#4ec9b0]">sic_code</span>
              </div>
            </div>

            <div class="bg-[#252526] border border-[#3c3c3c] rounded p-4">
              <h3 class="text-[14px] text-white font-medium mb-2">Operators</h3>
              <table class="w-full text-[12px]">
                <tbody>
                  <tr class="border-b border-[#3c3c3c]">
                    <td class="py-1.5 font-mono text-[#ce9178] w-40">=, !=, &lt;, &gt;</td>
                    <td class="py-1.5 text-[#858585]">Standard comparison</td>
                  </tr>
                  <tr class="border-b border-[#3c3c3c]">
                    <td class="py-1.5 font-mono text-[#ce9178]">in (...)</td>
                    <td class="py-1.5 text-[#858585]">Match any value in list</td>
                  </tr>
                  <tr class="border-b border-[#3c3c3c]">
                    <td class="py-1.5 font-mono text-[#ce9178]">not in (...)</td>
                    <td class="py-1.5 text-[#858585]">Exclude values in list</td>
                  </tr>
                  <tr class="border-b border-[#3c3c3c]">
                    <td class="py-1.5 font-mono text-[#ce9178]">like / ilike</td>
                    <td class="py-1.5 text-[#858585]">Pattern match (ilike = case insensitive). Use % as wildcard.</td>
                  </tr>
                  <tr class="border-b border-[#3c3c3c]">
                    <td class="py-1.5 font-mono text-[#ce9178]">&&</td>
                    <td class="py-1.5 text-[#858585]">Array overlap (for tags)</td>
                  </tr>
                  <tr class="border-b border-[#3c3c3c]">
                    <td class="py-1.5 font-mono text-[#ce9178]">and / or</td>
                    <td class="py-1.5 text-[#858585]">Combine conditions</td>
                  </tr>
                  <tr>
                    <td class="py-1.5 font-mono text-[#ce9178]">between ... and ...</td>
                    <td class="py-1.5 text-[#858585]">Range filter</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="bg-[#252526] border border-[#3c3c3c] rounded p-4">
              <h3 class="text-[14px] text-white font-medium mb-2">Sorting &amp; limiting</h3>
              <p class="text-[#858585] mb-2">Append to the end of your query:</p>
              <div class="space-y-1 font-mono text-[12px]">
                <div><span class="text-[#569cd6]">order by</span> <span class="text-[#4ec9b0]">snowflake</span> <span class="text-[#569cd6]">desc</span> <span class="text-[#6e6e6e]">— newest first (recommended)</span></div>
                <div><span class="text-[#569cd6]">order by</span> <span class="text-[#4ec9b0]">date_filed</span> <span class="text-[#569cd6]">asc</span> <span class="text-[#6e6e6e]">— oldest first</span></div>
                <div><span class="text-[#569cd6]">limit</span> <span class="text-[#b5cea8]">50</span> <span class="text-[#6e6e6e]">— max results</span></div>
              </div>
            </div>
          </div>
        </section>

        <!-- ===== DYNAMIC PARAMETERS ===== -->
        <section class="mb-12">
          <h2 class="text-[18px] font-semibold text-white mb-1 flex items-center gap-2">
            <ng-icon name="lucideCode" class="text-[#dcdcaa]" /> Dynamic Parameters
          </h2>
          <p class="text-[13px] text-[#858585] mb-4">Embed interactive inputs directly in your query using special syntax.</p>

          <div class="space-y-4 text-[13px]">
            <div class="bg-[#252526] border border-[#3c3c3c] rounded p-4">
              <h3 class="text-[14px] text-white font-medium mb-2">Syntax</h3>
              <div class="space-y-3 font-mono text-[12px]">
                <div>
                  <div class="text-[#858585] text-[11px] mb-1">Full syntax</div>
                  <code class="text-[#ce9178]">{{ '{' }}Label:ComponentType:DefaultValue{{ '}' }}</code>
                </div>
                <div>
                  <div class="text-[#858585] text-[11px] mb-1">Default component (StringInput) with default value</div>
                  <code class="text-[#ce9178]">{{ '{' }}Label::DefaultValue{{ '}' }}</code>
                </div>
                <div>
                  <div class="text-[#858585] text-[11px] mb-1">Default component, no default value</div>
                  <code class="text-[#ce9178]">{{ '{' }}Label{{ '}' }}</code>
                </div>
                <div>
                  <div class="text-[#858585] text-[11px] mb-1">Escape literal braces</div>
                  <code class="text-[#ce9178]">\\{{ '{' }} and \\{{ '}' }}</code>
                </div>
              </div>
            </div>

            <div class="bg-[#252526] border border-[#3c3c3c] rounded p-4">
              <h3 class="text-[14px] text-white font-medium mb-3">Component types</h3>
              <div class="space-y-4">
                <div class="flex gap-3">
                  <div class="flex-none w-6 h-6 flex items-center justify-center text-[#4ec9b0]">
                    <ng-icon name="lucideType" class="text-[16px]" />
                  </div>
                  <div>
                    <div class="text-white font-medium">StringInput <span class="text-[#858585] font-normal">(default)</span></div>
                    <div class="text-[#858585] text-[12px]">Free text input. Compiles to a single-quoted string: <code class="text-[#ce9178]">'value'</code></div>
                    <div class="text-[12px] font-mono mt-1 text-[#6e6e6e]">Example: {{ '{' }}Ticker::MSFT{{ '}' }} → <span class="text-[#ce9178]">'MSFT'</span></div>
                  </div>
                </div>
                <div class="flex gap-3">
                  <div class="flex-none w-6 h-6 flex items-center justify-center text-[#4ec9b0]">
                    <ng-icon name="lucideHash" class="text-[16px]" />
                  </div>
                  <div>
                    <div class="text-white font-medium">NumberInput</div>
                    <div class="text-[#858585] text-[12px]">Numeric input. Compiles to a raw number: <code class="text-[#ce9178]">42</code></div>
                    <div class="text-[12px] font-mono mt-1 text-[#6e6e6e]">Example: {{ '{' }}Limit:NumberInput:50{{ '}' }} → <span class="text-[#ce9178]">50</span></div>
                  </div>
                </div>
                <div class="flex gap-3">
                  <div class="flex-none w-6 h-6 flex items-center justify-center text-[#4ec9b0]">
                    <ng-icon name="lucideFileText" class="text-[16px]" />
                  </div>
                  <div>
                    <div class="text-white font-medium">FormTypes</div>
                    <div class="text-[#858585] text-[12px]">Dropdown of SEC form types (fetched from API). Compiles to a single-quoted string.</div>
                    <div class="text-[12px] font-mono mt-1 text-[#6e6e6e]">Example: {{ '{' }}Form Type:FormTypes:8-K{{ '}' }} → <span class="text-[#ce9178]">'8-K'</span></div>
                  </div>
                </div>
                <div class="flex gap-3">
                  <div class="flex-none w-6 h-6 flex items-center justify-center text-[#4ec9b0]">
                    <ng-icon name="lucideTag" class="text-[16px]" />
                  </div>
                  <div>
                    <div class="text-white font-medium">Tags</div>
                    <div class="text-[#858585] text-[12px]">Multi-select tag picker. Compiles to comma-separated quoted strings.</div>
                    <div class="text-[12px] font-mono mt-1 text-[#6e6e6e]">Example: {{ '{' }}Tags:Tags:Presentation{{ '}' }} → <span class="text-[#ce9178]">'Presentation'</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-[#252526] border border-[#3c3c3c] rounded p-4">
              <h3 class="text-[14px] text-white font-medium mb-2">Full example</h3>
              <div class="font-mono text-[12px] bg-[#1e1e1e] rounded p-3 leading-relaxed">
                <span class="text-[#4ec9b0]">form_type</span> <span class="text-[#d4d4d4]">=</span> <span class="text-[#dcdcaa]">{{ '{' }}Form Type:FormTypes:8-K{{ '}' }}</span><br>
                <span class="text-[#569cd6]">order by</span> <span class="text-[#4ec9b0]">snowflake</span> <span class="text-[#569cd6]">desc</span><br>
                <span class="text-[#569cd6]">limit</span> <span class="text-[#dcdcaa]">{{ '{' }}Limit:NumberInput:50{{ '}' }}</span>
              </div>
              <p class="text-[12px] text-[#858585] mt-2">This creates a Form Type dropdown (defaulting to 8-K) and a numeric limit input (defaulting to 50). The parameter inputs appear inline below the query editor.</p>
            </div>
          </div>
        </section>

        <!-- ===== SIDEBAR & QUERIES ===== -->
        <section class="mb-12">
          <h2 class="text-[18px] font-semibold text-white mb-1 flex items-center gap-2">
            <ng-icon name="lucideSidebar" class="text-[#c586c0]" /> Sidebar &amp; Saved Queries
          </h2>
          <p class="text-[13px] text-[#858585] mb-4">Manage your queries from the sidebar on the left.</p>

          <div class="space-y-3 text-[13px]">
            <div class="flex items-start gap-3 bg-[#252526] border border-[#3c3c3c] rounded p-4">
              <ng-icon name="lucidePlus" class="text-[16px] text-[#858585] mt-0.5 flex-none" />
              <div>
                <span class="text-white font-medium">New Query</span>
                <span class="text-[#858585]"> — Creates a new empty query called "Untitled Query". All edits to the query text and parameters are auto-saved.</span>
              </div>
            </div>
            <div class="flex items-start gap-3 bg-[#252526] border border-[#3c3c3c] rounded p-4">
              <ng-icon name="lucideMousePointerClick" class="text-[16px] text-[#858585] mt-0.5 flex-none" />
              <div>
                <span class="text-white font-medium">Selecting a query</span>
                <span class="text-[#858585]"> — Click any query in the sidebar to load it and automatically run a search.</span>
              </div>
            </div>
            <div class="flex items-start gap-3 bg-[#252526] border border-[#3c3c3c] rounded p-4">
              <ng-icon name="lucideEllipsisVertical" class="text-[16px] text-[#858585] mt-0.5 flex-none" />
              <div>
                <span class="text-white font-medium">Query actions (⋮ menu)</span>
                <span class="text-[#858585]"> — Hover over a query to reveal the menu with Duplicate, Rename, and Delete options. Blueprint queries also have a Reset option to restore the original.</span>
              </div>
            </div>
            <div class="flex items-start gap-3 bg-[#252526] border border-[#3c3c3c] rounded p-4">
              <ng-icon name="lucideRotateCcw" class="text-[16px] text-[#858585] mt-0.5 flex-none" />
              <div>
                <span class="text-white font-medium">Restore Defaults</span>
                <span class="text-[#858585]"> — Appears when you've deleted default blueprint queries. Brings back only deleted defaults without affecting your custom queries or modified blueprints.</span>
              </div>
            </div>
            <div class="flex items-start gap-3 bg-[#252526] border border-[#3c3c3c] rounded p-4">
              <ng-icon name="lucideList" class="text-[16px] text-[#858585] mt-0.5 flex-none" />
              <div>
                <span class="text-white font-medium">Default queries</span>
                <span class="text-[#858585]"> — Blueprint queries appear at the bottom of the sidebar with a slightly darker background. These are pre-built queries covering common SEC filing searches like Recent filings, IPOs, M&amp;A, etc.</span>
              </div>
            </div>
          </div>
        </section>

        <!-- ===== DOCUMENT VIEWER ===== -->
        <section class="mb-12">
          <h2 class="text-[18px] font-semibold text-white mb-1 flex items-center gap-2">
            <ng-icon name="lucideFileText" class="text-[#569cd6]" /> Document Viewer
          </h2>
          <p class="text-[13px] text-[#858585] mb-4">Click on a filing result to open the document viewer.</p>

          <div class="space-y-3 text-[13px]">
            <div class="bg-[#252526] border border-[#3c3c3c] rounded p-4">
              <p class="text-[#858585]">The document viewer displays SEC filing documents in an embedded frame. Use the sidebar to navigate between documents in the filing (HTM, HTML, TXT, XML files).</p>
              <ul class="mt-3 space-y-1 text-[#858585]">
                <li class="flex items-start gap-2"><span class="text-[#4ec9b0]">•</span> Documents are loaded directly from the API</li>
                <li class="flex items-start gap-2"><span class="text-[#4ec9b0]">•</span> The sidebar shows filing info, document list, and company details</li>
                <li class="flex items-start gap-2"><span class="text-[#4ec9b0]">•</span> Click any document in the list to switch between files</li>
                <li class="flex items-start gap-2"><span class="text-[#4ec9b0]">•</span> Use the external link button to view the filing on SEC.gov</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- ===== KEYBOARD SHORTCUTS ===== -->
        <section class="mb-12">
          <h2 class="text-[18px] font-semibold text-white mb-1">Keyboard Shortcuts</h2>

          <div class="bg-[#252526] border border-[#3c3c3c] rounded p-4 text-[13px]">
            <table class="w-full text-[12px]">
              <tbody>
                <tr class="border-b border-[#3c3c3c]">
                  <td class="py-1.5"><kbd class="px-1.5 py-0.5 bg-[#3c3c3c] rounded text-[#cccccc] font-mono text-[11px]">Ctrl+Enter</kbd></td>
                  <td class="py-1.5 text-[#858585]">Execute search</td>
                </tr>
                <tr>
                  <td class="py-1.5"><kbd class="px-1.5 py-0.5 bg-[#3c3c3c] rounded text-[#cccccc] font-mono text-[11px]">Ctrl+B</kbd></td>
                  <td class="py-1.5 text-[#858585]">Toggle sidebar</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  `,
})
export class HelpComponent {}
