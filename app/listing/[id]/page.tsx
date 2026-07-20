import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ishinadwelly.com/api';

async function getRental(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/rentals/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Error fetching rental for OG:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const rental = await getRental(params.id);
  if (!rental) {
    return {
      title: 'Listing Not Found | IshinaDwelly',
      description: 'The requested rental property could not be found.',
    };
  }

  const title = `${rental.title} - KES ${rental.price?.toLocaleString() ?? ''}/mo | IshinaDwelly`;
  const description = rental.description
    ? rental.description.substring(0, 160)
    : `Check out this ${rental.bedrooms ?? ''} bed rental located at ${rental.address ?? rental.city ?? 'Kenya'}. Available now on IshinaDwelly!`;
  
  const rawImage = rental.imageUrls?.[0] || 'https://ishinadwelly.com/icon.png';
  const imageUrl = rawImage.startsWith('http') ? rawImage : `https://api.ishinadwelly.com${rawImage}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://ishinadwelly.com/listing/${params.id}`,
      siteName: 'IshinaDwelly',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: rental.title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ListingPage({ params }: { params: { id: string } }) {
  const rental = await getRental(params.id);

  if (!rental) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-2">Property Not Found</h1>
        <p className="text-gray-400 mb-6">This listing may have been rented or removed by the owner.</p>
        <Link href="/" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition">
          Explore Dwelly
        </Link>
      </div>
    );
  }

  const rawImage = rental.imageUrls?.[0];
  const imageUrl = rawImage
    ? rawImage.startsWith('http')
      ? rawImage
      : `https://api.ishinadwelly.com${rawImage}`
    : '/icon.png';

  // Deep links for Android & Fallback
  const customSchemeUrl = `dwelly://listing/${params.id}`;
  const androidIntentUrl = `intent://listing/${params.id}#Intent;scheme=dwelly;package=com.ishinadwelly.app;end`;
  const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.ishinadwelly.app';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white flex flex-col justify-between p-4 sm:p-6">
      {/* Instant auto-redirect to mobile app */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var userAgent = navigator.userAgent || navigator.vendor || window.opera;
              if (/android/i.test(userAgent)) {
                setTimeout(function() {
                  window.location.replace("intent://listing/${params.id}#Intent;scheme=dwelly;package=com.ishinadwelly.app;end");
                }, 20);
              } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
                setTimeout(function() {
                  window.location.replace("dwelly://listing/${params.id}");
                }, 20);
              }
            })();
          `,
        }}
      />

      {/* Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-4 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-3">
          <img src="/icon.png" alt="IshinaDwelly Logo" className="w-10 h-10 rounded-xl" />
          <span className="text-xl font-extrabold tracking-tight">IshinaDwelly</span>
        </Link>
        <a
          href={playStoreUrl}
          className="text-xs sm:text-sm bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-full font-medium border border-gray-700 transition"
        >
          Download App
        </a>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl w-full mx-auto my-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Photo Gallery Preview */}
        <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-gray-800 border border-gray-800 shadow-2xl group">
          <img src={imageUrl} alt={rental.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-600/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {rental.propertyType || 'Rental'}
              </span>
              {rental.bedrooms > 0 && (
                <span className="bg-black/60 backdrop-blur-md text-gray-200 text-xs px-3 py-1 rounded-full font-medium">
                  {rental.bedrooms} Bed • {rental.bathrooms} Bath
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Listing Info & Actions */}
        <div className="flex flex-col justify-center space-y-6">
          <div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 mb-2">
              KES {rental.price?.toLocaleString() ?? 0}
              <span className="text-base sm:text-lg font-normal text-gray-400">/month</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
              {rental.title}
            </h1>
            <p className="text-gray-400 text-sm sm:text-base flex items-center gap-1.5">
              <svg className="w-5 h-5 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {rental.address ? `${rental.address}, ` : ''}{rental.city || 'Kenya'}
            </p>
          </div>

          <p className="text-gray-300 text-sm leading-relaxed line-clamp-4 bg-gray-800/50 p-4 rounded-xl border border-gray-800">
            {rental.description || 'No description provided.'}
          </p>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <a
              href={androidIntentUrl}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-blue-600/30 transition transform active:scale-[0.98] text-center"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396" />
              </svg>
              <span>Open in IshinaDwelly App</span>
            </a>

            <a
              href={playStoreUrl}
              className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold py-3.5 px-6 rounded-2xl border border-gray-700 transition text-center text-sm"
            >
              <span>Don&apos;t have the app?</span>
              <span className="text-emerald-400 font-bold underline">Get it on Google Play</span>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center py-6 border-t border-gray-800/80 text-gray-500 text-xs">
        &copy; {new Date().getFullYear()} IshinaDwelly. All rights reserved.
      </footer>
    </div>
  );
}
