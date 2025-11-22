import { db } from '../config/firebaseConfig';
import {
  CollectionReference,
  DocumentData,
  Query,
  DocumentSnapshot,
  Timestamp
} from 'firebase-admin/firestore';
import { PaginatedResponse, SortOrder } from '../types';

export abstract class BaseRepository<T extends { id: string }> {
  protected collection: CollectionReference<DocumentData>;
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
    this.collection = db.collection(collectionName);
  }

  // Convert Firestore Timestamps to Dates
  protected convertTimestamps(data: DocumentData): DocumentData {
    const converted: DocumentData = { ...data };
    for (const key in converted) {
      if (converted[key] instanceof Timestamp) {
        converted[key] = converted[key].toDate();
      }
    }
    return converted;
  }

  // Convert document snapshot to entity
  protected docToEntity(doc: DocumentSnapshot): T | null {
    if (!doc.exists) return null;
    const data = this.convertTimestamps(doc.data()!);
    return { id: doc.id, ...data } as T;
  }

  async create(data: Omit<T, 'id'>): Promise<T> {
    const docRef = this.collection.doc();
    const now = new Date();
    const entityData = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await docRef.set(entityData);
    return { id: docRef.id, ...entityData } as unknown as T;
  }

  async findById(id: string): Promise<T | null> {
    const doc = await this.collection.doc(id).get();
    return this.docToEntity(doc);
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) return null;

    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    // Remove id from update data if present
    delete (updateData as Partial<T> & { id?: string }).id;

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();
    return this.docToEntity(updatedDoc);
  }

  async delete(id: string): Promise<boolean> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) return false;

    await docRef.delete();
    return true;
  }

  async exists(id: string): Promise<boolean> {
    const doc = await this.collection.doc(id).get();
    return doc.exists;
  }

  // Helper method for pagination
  protected async paginateQuery(
    query: Query<DocumentData>,
    page: number,
    limit: number
  ): Promise<PaginatedResponse<T>> {
    // Get total count (this requires fetching all matching docs)
    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    // Get paginated results
    const offset = (page - 1) * limit;
    const snapshot = await query.offset(offset).limit(limit).get();

    const data = snapshot.docs.map(doc => this.docToEntity(doc)!);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // Helper to apply sort to query
  protected applySort(
    query: Query<DocumentData>,
    field: string,
    order: SortOrder
  ): Query<DocumentData> {
    return query.orderBy(field, order);
  }

  // Clear all documents (for testing)
  async clearAll(): Promise<void> {
    const snapshot = await this.collection.get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }
}
