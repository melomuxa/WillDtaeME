import Script from 'next/script'

/**
 * Meta (Facebook) Pixel loader.
 *
 * Renders the Meta Pixel base code so the Facebook page / ad account can
 * track page views and conversions. The Pixel ID is read from the
 * NEXT_PUBLIC_FACEBOOK_PIXEL_ID env var — when it's empty the component
 * renders nothing, so the pixel never loads in environments where it isn't
 * configured (mirrors the donation feature-flag pattern).
 *
 * Uses next/script with strategy="afterInteractive" so the snippet loads
 * after the page is interactive and never blocks first paint. The official
 * inline init script is injected via dangerouslySetInnerHTML because Meta's
 * loader self-executes on insertion.
 */
export function MetaPixel() {
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || null
  if (!pixelId) return null

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
