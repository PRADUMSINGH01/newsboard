import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const q = query(collection(db, "kavita"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const articles = snap.docs.map((d) => {
      const data = d.data();
      let createdAt = null;
      if (data.createdAt && typeof data.createdAt.toDate === "function") {
        createdAt = data.createdAt.toDate().toISOString();
      } else if (data.time) {
        createdAt = new Date(data.time).toISOString();
      }
      return {
        id: d.id,
        title: data.title || "",
        slug: data.slug || "",
        tag: data.tag || "",
        img: data.img || "",
        excerpt: data.excerpt || "",
        content: data.content || "",
        sections: data.sections || [],
        author: data.author || "",
        avatar: data.avatar || "",
        views: data.views || 0,
        createdAt,
      };
    });
    return NextResponse.json(articles);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const slug =
      body.slug ||
      body.title
        .toLowerCase()
        .replace(/[^\w\s\u0900-\u097F]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 80);

    const docData = {
      title: body.title || "",
      slug,
      tag: body.tag || "",
      img: body.img || "",
      excerpt: body.excerpt || "",
      content: body.content || "",
      sections: body.sections || [],
      author: body.author || "",
      avatar: body.avatar || "",
      views: 0,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "kavita"), docData);
    return NextResponse.json({ id: docRef.id, ...docData }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
