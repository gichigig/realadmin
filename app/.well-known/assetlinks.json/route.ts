import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    [
      {
        relation: ["delegate_permission/common.handle_all_urls", "delegate_permission/common.get_login_creds"],
        target: {
          namespace: "android_app",
          package_name: "com.ishinadwelly.app",
          sha256_cert_fingerprints: [
            "C1:20:78:5B:80:EE:C6:FB:A7:4D:48:6F:54:4D:B5:E7:5E:E3:CF:B7:0D:CC:93:81:9C:9C:B3:7F:36:BB:00:66"
          ]
        }
      }
    ],
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
