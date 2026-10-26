// A stack of receipt slips: the product's own artefacts make the hero, not stock imagery.
export function TicketStack() {
  return (
    <div className="relative mx-auto h-[470px] w-full max-w-[460px]" aria-hidden="true">
      <div className="absolute left-0 top-6 w-[250px] -rotate-3 bg-white font-slip text-[12px] text-ink shadow-lift">
        <div className="p-4 leading-5">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-bold">KITCHEN ORDER</p>
            <span className="rounded bg-chili-50 px-1.5 py-0.5 text-[10px] font-bold text-chili-600">NEW</span>
          </div>
          <p className="text-ink-mute">KOT #3 · Table T4 · 2 min</p>
          <div className="my-2 border-t border-dashed border-ink/30" />
          <p className="font-bold">2 × Paneer Tikka</p>
          <p className="font-bold">4 × Butter Naan</p>
          <p className="pl-4 text-pine-700">+ extra butter</p>
          <p className="font-bold">1 × Masala Chai</p>
          <p className="mt-2 rounded bg-turmeric-50 px-2 py-1">Note: less spicy</p>
        </div>
        <div className="slip-teeth" />
      </div>

      <div className="absolute right-0 top-24 w-[250px] rotate-2 bg-white font-slip text-[12px] text-ink shadow-lift">
        <div className="p-4 leading-5">
          <p className="text-center text-[13px] font-bold">Spice Route Kitchen</p>
          <p className="text-center text-ink-mute">INV-00042 · Table T4</p>
          <div className="my-2 border-t border-dashed border-ink/30" />
          <div className="flex justify-between"><span>Subtotal</span><span>₹710.00</span></div>
          <div className="flex justify-between"><span>CGST 2.5%</span><span>₹17.75</span></div>
          <div className="flex justify-between"><span>SGST 2.5%</span><span>₹17.75</span></div>
          <div className="flex justify-between text-ink-mute"><span>Round off</span><span>₹0.50</span></div>
          <div className="my-2 border-t border-dashed border-ink/30" />
          <div className="flex justify-between text-[15px] font-bold"><span>TOTAL</span><span>₹746</span></div>
          <p className="mt-2">Paid · UPI ₹400 + Cash ₹346</p>
          <p className="mt-2 rounded bg-pine-50 px-2 py-1 font-bold text-pine-700">Sent on WhatsApp</p>
        </div>
        <div className="slip-teeth" />
      </div>

      <div className="absolute bottom-2 left-8 w-[270px] rotate-[-1.5deg] bg-white font-slip text-[12px] text-ink shadow-lift">
        <div className="flex items-center justify-between gap-3 p-3">
          <div className="leading-5">
            <p className="font-bold">T2 · Veg Biryani × 2</p>
            <p className="text-ink-mute">Kitchen marked ready</p>
          </div>
          <span className="rounded bg-pine-600 px-2 py-1 text-[11px] font-bold text-white">SERVE</span>
        </div>
        <div className="slip-teeth" />
      </div>
    </div>
  );
}
