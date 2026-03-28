import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const snap = await getDoc(doc(db, "kavita", id));
    if (!snap.exists()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const data = snap.data();
    let createdAt = null;
    if (data.createdAt && typeof data.createdAt.toDate === "function") {
      createdAt = data.createdAt.toDate().toISOString();
    } else if (data.time) {
      createdAt = new Date(data.time).toISOString();
    }
    return NextResponse.json({
      id: snap.id,
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
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    const fields = [
      "title",
      "slug",
      "tag",
      "img",
      "excerpt",
      "content",
      "sections",
      "author",
      "avatar",
    ];
    for (const f of fields) {
      if (body[f] !== undefined) updateData[f] = body[f];
    }

    await updateDoc(doc(db, "kavita", id), updateData);
    return NextResponse.json({ id, ...updateData });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteDoc(doc(db, "kavita", id));
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}        
