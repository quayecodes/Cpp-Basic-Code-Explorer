import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Fast, Reliable Tech Support in Ghana
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Connect with verified technicians for all your IT needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link
                  to={user?.role === 'technician' ? '/technician/dashboard' : '/client/dashboard'}
                  className="bg-white text-primary-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg text-lg transition-colors"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="bg-white text-primary-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg text-lg transition-colors"
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/login"
                    className="bg-transparent border-2 border-white hover:bg-white hover:text-primary-600 font-bold py-3 px-8 rounded-lg text-lg transition-colors"
                  >
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Submit Request</h3>
              <p className="text-gray-600">
                Describe your tech issue and location
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Matched</h3>
              <p className="text-gray-600">
                Connect with nearby verified technicians
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Fixed</h3>
              <p className="text-gray-600">
                Pay securely via Mobile Money after service
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { name: 'Computer Repair', desc: 'Desktop & laptop fixes' },
              { name: 'Software Issues', desc: 'OS & app troubleshooting' },
              { name: 'Network Setup', desc: 'Wi-Fi & router config' },
              { name: 'Printer Setup', desc: 'Installation & repairs' },
              { name: 'Phone Repair', desc: 'Smartphone issues' },
              { name: 'Data Recovery', desc: 'Recover lost files' },
              { name: 'Virus Removal', desc: 'Malware cleaning' },
              { name: 'Digital Training', desc: 'Learn computer basics' },
            ].map((service, index) => (
              <div key={index} className="card hover:shadow-lg transition-shadow">
                <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                <p className="text-gray-600 text-sm">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8">Join thousands of satisfied customers across Ghana</p>
          {!isAuthenticated && (
            <Link
              to="/register"
              className="bg-white text-primary-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg text-lg transition-colors inline-block"
            >
              Sign Up Now
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Landing;
