import { expect, test } from '@playwright/test';
const permissions = ['dealers.view', 'dealers.create', 'dealers.edit', 'stock.view', 'stock.upload', 'stock.edit', 'stock.price', 'stock.dealer', 'sales.view', 'sales.record', 'payments.view', 'payments.record', 'adjustments', 'audit.view'];
async function setup(page: any, role = 'ADMIN', options: {
  enabled?: boolean;
  statement?: boolean;
  permissions?: string[];
} = {}) {
  await page.addInitScript(({
    role
  }: {
    role: string;
  }) => {
    localStorage.setItem('token', 'test-login');
    localStorage.setItem('vnw_language', 'en');
    localStorage.setItem('user', JSON.stringify({
      user_id: role === 'ADMIN' ? 1 : 3,
      full_name: 'Test account',
      role,
      permissions: role === 'ADMIN' ? ['*'] : []
    }));
  }, {
    role
  });
  const dealers: any[] = [{
    dealer_id: 1,
    dealer_code: 'VNW-B001',
    dealer_type: 'BASIC',
    name: 'Sample Dealer',
    contact_name: 'Sample Contact',
    phone: '9000000003',
    email: 'a@example.test',
    status: 'ACTIVE',
    linked_user_id: 3,
    version: 1
  }];
  const stock: any[] = [];
  const sales: any[] = [];
  const payments: any[] = [];
  const writes: any[] = [];
  const errors: string[] = [];
  page.on('pageerror', (e: any) => errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**', (route: any) => route.fulfill({
    contentType: 'text/css',
    body: ''
  }));
  await page.route('**/vipnumberworld/**', async (route: any) => {
    const url = route.request().url();
    const action = url.split('/').at(-1);
    const p = route.request().postDataJSON() || {};
    let data: any = [];
    if (url.includes('/dealer-management/')) {
      if (action === 'capabilities') data = {
        enabled: options.enabled !== false,
        permissions: options.permissions ?? (role === 'ADMIN' ? permissions : []),
        statement: options.statement ?? role === 'USER',
        admin: role === 'ADMIN'
      };else if (action === 'dealers') data = {
        items: dealers,
        total: dealers.length,
        page: 1,
        limit: 100
      };else if (action === 'stock') data = {
        items: stock,
        total: stock.length,
        page: 1,
        limit: 25
      };else if (action === 'sales') data = {
        items: p.settlement === 'PENDING' ? sales.filter(r => !r.settled_payment_id) : sales,
        total: sales.length,
        page: 1,
        limit: 25
      };else if (action === 'payments') data = {
        items: payments,
        total: payments.length,
        page: 1,
        limit: 25
      };else if (action === 'adjustments' || action === 'audit') data = {
        items: [],
        total: 0,
        page: 1,
        limit: 25
      };else if (action === 'dealerSave') {
        writes.push({
          action,
          ...p
        });
        dealers.push({
          ...p,
          dealer_id: 2,
          dealer_code: 'VNW-P001',
          version: 1
        });
        data = {
          dealer_id: 2
        };
      } else if (action === 'stockAdd') {
        writes.push({
          action,
          ...p
        });
        for (const row of p.rows) stock.push({
          ...row,
          stock_id: stock.length + 1,
          dealer_code: 'VNW-B001',
          dealer_name: 'Sample Dealer',
          state: 'INVENTORY',
          digit_total: 35,
          root_sum: 8,
          patterns_json: '["Doubling"]',
          version: 1
        });
        data = {
          created: p.rows.length
        };
      } else if (action === 'stockSave') {
        writes.push({
          action,
          ...p
        });
        Object.assign(stock.find(r => r.stock_id === p.stock_id), p, {
          version: p.version + 1
        });
        data = {
          saved: true
        };
      } else if (action === 'sell') {
        writes.push({
          action,
          ...p
        });
        const row = stock.find(r => r.stock_id === p.stock_id);
        row.state = 'SOLD';
        row.version++;
        sales.push({
          ...row,
          ...p,
          sale_id: sales.length + 1,
          status: 'ACTIVE',
          settlement_status: 'PENDING',
          sold_at: p.sold_at,
          commission: '7000',
          profit: '6500',
          settled_payment_id: null
        });
        data = {
          sale_id: 1
        };
      } else if (action === 'summary') data = {
        total_stock: stock.length,
        live: stock.filter(r => r.state === 'INVENTORY').length,
        sold: sales.length,
        total_payable: '15000',
        paid: payments.length ? '15000' : '0',
        pending: payments.length ? '0' : '15000',
        profit: '6500',
        recovery_outstanding: '0'
      };else if (action === 'paymentPreview') data = {
        gross_amount: '15000.00',
        recovery_amount: '0.00',
        net_amount: '15000.00',
        rows: sales,
        dealer: dealers[0],
        recoveries: []
      };else if (action === 'paymentRecord') {
        writes.push({
          action,
          ...p
        });
        payments.push({
          ...p,
          payment_id: 1,
          payment_code: 'VNW-PAY-000001',
          dealer_code: 'VNW-B001',
          dealer_name: 'Sample Dealer',
          status: 'POSTED'
        });
        sales[0].settled_payment_id = 1;
        sales[0].settlement_status = 'PAID';
        data = {
          payment_id: 1,
          payment_code: 'VNW-PAY-000001'
        };
      } else if (action === 'receipt') data = {
        payment: {
          ...payments[0],
          dealer_code: 'VNW-B001',
          name: 'Sample Dealer',
          phone: '9000000003',
          staff_name: 'Admin',
          created_by: 1
        },
        numbers: [{
          number_value: '8008009307',
          amount: '15000',
          sale_id: 1
        }],
        recovery_allocations: [],
        pending: {
          number_count: 0,
          amount: '0'
        }
      };else if (action === 'statement') data = {
        dealer: {
          dealer_code: 'VNW-B001',
          name: 'Sample Dealer'
        },
        items: [{
          sale_id: 1,
          number_value: '8008009307',
          sold_at: '2026-10-20 10:00',
          dealer_amount: '15000.00',
          settlement_status: 'PAID',
          paid_at: '2026-10-20 12:00',
          payment_code: 'VNW-PAY-000001'
        }],
        total: 1,
        page: 1,
        limit: 25,
        summary: {
          total_sold: '15000',
          total_paid: '15000',
          pending: '0',
          recovery_outstanding: '0'
        },
        adjustments: []
      };else if (action === 'staff') data = {
        permissions,
        users: [],
        grants: []
      };
    } else if (url.endsWith('/auth/me')) data = {
      user_id: role === 'ADMIN' ? 1 : 3,
      full_name: 'Test account',
      role,
      permissions: role === 'ADMIN' ? ['*'] : []
    };else if (url.endsWith('/notifications/list')) data = [];
    await route.fulfill({
      json: {
        status: 1,
        info: 'OK',
        data
      }
    });
  });
  return {
    dealers,
    stock,
    sales,
    payments,
    writes,
    errors
  };
}
test('standalone stock, inline edits, sale, full-number payment and receipt work at mobile and desktop sizes', async ({
  page
}, info) => {
  const state = await setup(page);
  await page.emulateMedia({
    reducedMotion: 'reduce'
  });
  await page.setViewportSize({
    width: 1366,
    height: 900
  });
  await page.goto('/admin/dealer-management');
  const module = page.getByTestId('dealer-management');
  await expect(module.getByRole('heading', {
    name: 'Standalone Dealer Management'
  })).toHaveCount(0);
  await expect(module.getByRole('button', { name: 'Refresh', exact: true })).toBeVisible();
  await module.getByRole('tab', {
    name: 'Stock',
    exact: true
  }).click();
  await module.getByRole('button', {
    name: 'Add numbers',
    exact: true
  }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Dealer', {
    exact: true
  }).selectOption('1');
  await dialog.getByLabel('Mobile numbers').fill('8008009307');
  await dialog.getByLabel('Dealer cost (₹)').fill('15000');
  await dialog.getByLabel('Selling price (₹)').fill('22000');
  for (const width of [320, 375, 768, 1366, 1920]) {
    await page.setViewportSize({
      width,
      height: 900
    });
    expect(await dialog.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  }
  await dialog.getByRole('button', {
    name: 'Add module stock'
  }).click();
  await expect(dialog).toHaveCount(0);
  await page.setViewportSize({
    width: 1366,
    height: 900
  });
  let row = module.locator('tbody tr').filter({
    hasText: '8008009307'
  }).first();
  await row.getByRole('button', {
    name: 'Edit',
    exact: true
  }).click();
  await module.getByLabel('Selling price', {
    exact: true
  }).fill('23000');
  await module.getByLabel('Reason for stock change').fill('Adjusted intended sale price');
  await module.getByRole('button', {
    name: 'Save',
    exact: true
  }).click();
  await expect(module.getByText('₹23,000.00', {
    exact: true
  })).toBeVisible();
  row = module.locator('tbody tr').filter({
    hasText: '8008009307'
  }).first();
  await row.getByRole('button', {
    name: 'Mark sold'
  }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Customer sale price (₹)').fill('22000');
  await dialog.getByLabel('Charges (₹)').fill('500');
  await expect(dialog.getByText('₹6,500.00', {
    exact: true
  })).toBeVisible();
  await dialog.getByRole('button', {
    name: 'Confirm sale',
    exact: true
  }).click();
  await expect(dialog).toHaveCount(0);
  await module.getByRole('tab', {
    name: 'Payments',
    exact: true
  }).click();
  await module.getByRole('combobox', {
    name: 'Dealer',
    exact: true
  }).selectOption('1');
  await module.getByRole('button', {
    name: 'Record payment',
    exact: true
  }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Select 8008009307', {
    exact: true
  }).check();
  await dialog.getByRole('button', {
    name: 'Review 1 selected numbers'
  }).click();
  await dialog.getByLabel('UTR / reference').fill('UTR-123456');
  await dialog.getByRole('button', {
    name: 'Confirm recorded payment'
  }).click();
  await expect(page.getByRole('dialog').getByText('VNW-PAY-000001 · POSTED', {
    exact: true
  })).toBeVisible();
  await expect(page.getByRole('link', {
    name: 'Share on WhatsApp',
    exact: true
  })).toHaveAttribute('href', /15000|15%2C000/);
  await page.screenshot({
    path: info.outputPath('dealer-payment-desktop.png')
  });
  await page.getByRole('button', {
    name: 'Close dialog',
    exact: true
  }).click();
  await page.setViewportSize({
    width: 375,
    height: 900
  });
  await expect(module).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({
    path: info.outputPath('dealer-module-mobile.png')
  });
  expect(state.writes.map(w => w.action)).toEqual(['stockAdd', 'stockSave', 'sell', 'paymentRecord']);
  expect(state.writes.every(w => typeof w.request_key === 'string' && w.request_key.length > 16)).toBeTruthy();
  expect(state.errors).toEqual([]);
});
test('dealer statement has only safe fields and is usable on narrow screens', async ({
  page
}, info) => {
  const state = await setup(page, 'USER');
  await page.setViewportSize({
    width: 375,
    height: 812
  });
  await page.goto('/dealer-statement');
  const statement = page.getByTestId('dealer-statement');
  await expect(statement.getByText('8008009307', {
    exact: true
  })).toBeVisible();
  await expect(statement.getByText('VNW-PAY-000001', {
    exact: true
  })).toBeVisible();
  await expect(statement.getByText(/commission|profit|charges|selling price/i)).toHaveCount(0);
  await statement.getByLabel('Statement status').selectOption('PAID');
  await expect(statement.getByText('8008009307', {
    exact: true
  })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({
    path: info.outputPath('dealer-statement-mobile.png')
  });
  expect(state.writes).toEqual([]);
  expect(state.errors).toEqual([]);
});
test('module stays hidden when migration is unavailable and employees do not inherit wildcard access', async ({
  page
}) => {
  await setup(page, 'EMPLOYEE', {
    enabled: false,
    permissions: []
  });
  await page.goto('/employee/dealer-management');
  await expect(page.getByText('This module is disabled or its SQL migration has not been applied.', {
    exact: false
  })).toBeVisible();
  await expect(page.getByRole('link', {
    name: 'Dealer Management',
    exact: true
  })).toHaveCount(0);
});
test('statement translations preserve private values and fit all supported languages and widths', async ({
  page
}) => {
  test.setTimeout(120000);
  const state = await setup(page, 'USER');
  for (const language of ['en', 'hi', 'mr', 'hg', 'gu', 'bn', 'pa', 'ta', 'te', 'kn', 'ml', 'or']) {
    await page.goto('/dealer-statement?lang=' + language);
    const statement = page.getByTestId('dealer-statement');
    await expect(statement.getByText('8008009307', {
      exact: true
    })).toBeVisible();
    const heading = statement.locator('h1');
    if (language === 'en') await expect(heading).toHaveText('Dealer Statement');else await expect(heading).not.toHaveText('Dealer Statement');
    for (const width of [320, 375, 768, 1366, 1920]) {
      await page.setViewportSize({
        width,
        height: 900
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    }
    await expect(statement.getByText('VNW-PAY-000001', {
      exact: true
    })).toBeAttached();
  }
  expect(state.errors).toEqual([]);
});
