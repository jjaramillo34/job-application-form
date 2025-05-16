import { notFound } from 'next/navigation';
import { ObjectId } from 'mongodb';
import clientPromise from '@/app/lib/mongodb';
import CouponManager from '@/app/components/CouponManager';

interface Student {
  _id: ObjectId;
  status: string;
  // ... other student fields
}

export default async function StudentDetail({ params }: { params: { id: string } }) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);
  const collection = db.collection('applications');

  const student = await collection.findOne({ _id: new ObjectId(params.id) }) as Student | null;

  if (!student) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ... existing student details ... */}
      
      <div className="mt-8">
        <CouponManager 
          studentId={student._id.toString()} 
          isAccepted={student.status === 'accepted'} 
        />
      </div>
    </div>
  );
} 