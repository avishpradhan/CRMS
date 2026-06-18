const existingAdmin = await User.findOne({
  email: process.env.ADMIN_EMAIL,
});

if (existingAdmin) {
  console.log('Admin account already exists. Skipping seed.');
} else {
  await User.create({
    fullName: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    role: 'admin',
    isActive: true,
  });

  console.log('Admin account created successfully!');
  console.log(`Email: ${process.env.ADMIN_EMAIL}`);
}