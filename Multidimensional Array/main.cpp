#include <iostream>

using namespace std;

int main()
{
   cout << "\t -----------------------Multidimensional Arrays--------------------" <<endl;
   cout << "code by: MIchael N.A. Quaye                    Email:millcode@outlook.com" <<endl;
   cout <<endl;

   string details[4][3] =
   {
       { "       NAME","         STUDENT ID","              PROGRAMME"},
       { "1. Michael Quaye","     14589263","          BSc. Computer Science"},
       { "2. Eric Quaye","        14245738","          BSc. Civil Engineering"},
       { "3. James Quaye","       14825272","          BSc. Electrical Engineering"}
   };

   for(int a=0; a<4; a++)
   {
       for(int i=0; i<3; i++)
       {
           cout << details[a][i] << " ";
       }
       cout <<endl;
   }
    return 0;
}
