# Gureygroup frontend storyboard

All design and motion references are from Awwwards. Keep the existing indigo commerce identity.

| Surface | Desktop | Mobile | Reference |
| --- | --- | --- | --- |
| Workspace context | Native, named branch selector beside search; always visible | Wrapping toolbar with full readable location selector | [Shop Local RI filtering](https://www.awwwards.com/inspiration/product-listings-filtering-shop-local-ri) |
| POS catalogue | Stable cards, live result count, clear search/no-match recovery | Two-column catalogue and native-size search | [Shop Local RI filtering](https://www.awwwards.com/inspiration/product-listings-filtering-shop-local-ri) |
| Feedback | Border/surface response in 160ms; no repeated card entrance while filtering | Same feedback with stable prices and counts | [Eduard Bodak navigation](https://www.awwwards.com/inspiration/navigation-micro-animation-eduard-bodak-portfolio) |
| Shared dialogs | Contained keyboard focus, Escape, return to trigger | Scrollable sheet, native keyboard access | [Eduard Bodak navigation](https://www.awwwards.com/inspiration/navigation-micro-animation-eduard-bodak-portfolio) |

Retain APIs, authentication, inventory and checkout calculations, tenant authorization and stored formats. Respect reduced motion. Production publication is separate.

Startup failure uses a quiet centered recovery panel and a single reload action, adapting the same Bodak feedback reference. No configuration or stack details are shown in the product UI.

## Technology study: GrowthBook

https://www.awwwards.com/sites/growthbook
https://www.awwwards.com/inspiration/layout-growthbook
https://www.awwwards.com/inspiration/interaction-growthbook

Adapt the modular software composition and violet/green focal palette to a branch-aware commerce terminal. Desktop: catalogue and current-order panels have distinct headings and surfaces; product cards have an image area, SKU and stable price/stock footer. Phone: catalogue precedes checkout; branch selection remains conspicuous. A 3px product lift and rotating add glyph acknowledge intent, while order rows enter briefly. Reduced motion removes these effects. No animated money or bouncing success icon.

ProductTile is shared between the actual POS and isolated `/design-preview.html` (`/design`) entry. The latter is explicitly labeled sample catalogue and never initializes authentication, calls APIs, takes payments or submits orders. It demonstrates search, branch context, sample basket and inventory/report presentation. The application retains its checkout, inventory, tax and permission logic. Source assets and claims are not copied.
